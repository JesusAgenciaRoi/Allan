import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useService } from '../../state/DataContext';
import { useToast } from '../../state/ToastContext';
import { ConfirmDialog, EmptyState, ErrorBlock, Field, LoadingBlock, Notice } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { FramingEditor } from '../../components/FramingEditor';
import { DIFFICULTIES, MUSCLE_GROUPS } from '../../content/muscleGroups';
import { config } from '../../config';
import { validateMediaFile, validateRequired } from '../../lib/validation';
import { normalizeFraming } from '../../lib/framing';
import { formatDate } from '../../lib/plan';
import { readMediaSize } from '../../lib/media';
import { DEFAULT_FRAMING, type Exercise, type ExerciseInput, type ExerciseMedia, type Framing, type MuscleGroupId } from '../../types/domain';

const EMPTY: ExerciseInput = {
  title: '',
  primaryMuscle: 'pecho',
  secondaryMuscles: [],
  procedure: '',
  technicalCues: '',
  commonMistakes: '',
  equipment: '',
  difficulty: null,
  movementPattern: '',
  active: true,
};

export default function ExerciseEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const existing = useQuery((s) => (id ? s.getExercise(id) : Promise.resolve(null)), [id]);

  if (!isNew && existing.error) return <ErrorBlock error={existing.error} onRetry={existing.reload} />;
  if (!isNew && existing.data === undefined) return <LoadingBlock rows={4} />;
  if (!isNew && existing.data === null)
    return (
      <EmptyState title="Ejercicio no encontrado" action={<Link to="/app/entrenador/ejercicios" className="btn">Volver</Link>}>
        No existe o no tienes acceso.
      </EmptyState>
    );
  return <Editor key={id ?? 'new'} exercise={existing.data ?? null} />;
}

function Editor({ exercise }: { exercise: Exercise | null }) {
  const service = useService();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<ExerciseInput>(() =>
    exercise
      ? {
          title: exercise.title,
          primaryMuscle: exercise.primaryMuscle,
          secondaryMuscles: exercise.secondaryMuscles,
          procedure: exercise.procedure,
          technicalCues: exercise.technicalCues,
          commonMistakes: exercise.commonMistakes,
          equipment: exercise.equipment,
          difficulty: exercise.difficulty,
          movementPattern: exercise.movementPattern,
          active: exercise.active,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [savedMedia, setSavedMedia] = useState<ExerciseMedia | null>(exercise?.media ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExerciseMedia | null>(exercise?.media ?? null);
  const [framing, setFraming] = useState<Framing>(normalizeFraming(exercise?.media?.framing ?? DEFAULT_FRAMING));
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const savedFraming = normalizeFraming(savedMedia?.framing ?? DEFAULT_FRAMING);
  const framingDirty = !!savedMedia && !pendingFile && JSON.stringify(savedFraming) !== JSON.stringify(normalizeFraming(framing));

  useEffect(() => {
    document.title = `${exercise ? 'Editar' : 'Nuevo'} ejercicio — AF Team`;
  }, [exercise]);
  // Liberar blob: de la vista previa local al cambiar/salir.
  useEffect(() => {
    const url = preview?.url;
    return () => {
      if (url?.startsWith('blob:') && pendingFile) URL.revokeObjectURL(url);
    };
  }, [preview, pendingFile]);

  const set = <K extends keyof ExerciseInput>(k: K, v: ExerciseInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const check = validateMediaFile(file);
    if (!check.ok) {
      setFileError(check.error!);
      return;
    }
    setFileError(null);
    const url = URL.createObjectURL(file);
    const dims = await readMediaSize(url, file.type);
    setPendingFile(file);
    setPreview({
      id: 'preview',
      exerciseId: exercise?.id ?? 'new',
      url,
      storagePath: null,
      mimeType: file.type,
      sizeBytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      framing,
      persisted: false,
    });
    // Sugerencia inicial: GIF vertical en caja 4:3 → contener para no recortar.
    if (!savedMedia) setFraming({ ...DEFAULT_FRAMING });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void pickFile(e.dataTransfer.files?.[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = {
      title: validateRequired(form.title, 'El título', 120),
      procedure: form.procedure.length > 4000 ? 'Máximo 4000 caracteres.' : null,
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      document.getElementById('ex-title')?.focus();
      return;
    }
    setBusy(true);
    try {
      const saved = await service.saveExercise(form, exercise?.id);
      if (pendingFile) {
        setProgress(0);
        const media = await service.uploadExerciseMedia(saved.id, pendingFile, framing, (p) => setProgress(Math.round((p.loaded / Math.max(1, p.total)) * 100)));
        setSavedMedia(media);
        setPreview(media);
        setPendingFile(null);
      } else if (framingDirty) {
        await service.saveMediaFraming(saved.id, framing);
        setSavedMedia((m) => (m ? { ...m, framing } : m));
      }
      toast(
        'success',
        pendingFile && service.mode === 'demo'
          ? 'Ejercicio guardado. Modo demo: el GIF es una vista previa local y se perderá al recargar.'
          : 'Ejercicio guardado.',
      );
      if (!exercise) navigate(`/app/entrenador/ejercicios/${saved.id}`, { replace: true });
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const toggleSecondary = (m: MuscleGroupId) =>
    set('secondaryMuscles', form.secondaryMuscles.includes(m) ? form.secondaryMuscles.filter((x) => x !== m) : [...form.secondaryMuscles, m]);

  return (
    <form onSubmit={submit} noValidate className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div>
        <Link to="/app/entrenador/ejercicios" className="breadcrumb">
          <Icon name="arrowLeft" size={16} /> Biblioteca
        </Link>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">{exercise ? exercise.title : 'Nuevo ejercicio'}</h1>
            {exercise && (
              <p className="page-sub">
                Creado {formatDate(exercise.createdAt)} · Actualizado {formatDate(exercise.updatedAt, true)}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn--gold" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            Guardar
          </button>
        </div>
      </div>

      <section className="card stack" aria-labelledby="datos-t">
        <h2 id="datos-t" className="card__title">
          Datos del ejercicio
        </h2>
        <div className="form-grid form-grid--2">
          <Field label="Título" htmlFor="ex-title" error={errors.title} className="span-all">
            <input id="ex-title" className="input" maxLength={120} value={form.title} aria-invalid={!!errors.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Grupo muscular principal" htmlFor="ex-primary">
            <select id="ex-primary" className="select" value={form.primaryMuscle} onChange={(e) => set('primaryMuscle', e.target.value as MuscleGroupId)}>
              {MUSCLE_GROUPS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado" htmlFor="ex-active">
            <label className="checkbox">
              <input id="ex-active" type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
              {form.active ? 'Activo (visible para asignar)' : 'Inactivo'}
            </label>
          </Field>
          <div className="field span-all">
            <span className="field__label" id="sec-label">
              Grupos secundarios (opcional)
            </span>
            <div className="muscle-picker" role="group" aria-labelledby="sec-label">
              {MUSCLE_GROUPS.filter((m) => m.id !== form.primaryMuscle).map((m) => (
                <button key={m.id} type="button" className="chip" aria-pressed={form.secondaryMuscles.includes(m.id)} onClick={() => toggleSecondary(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Procedimiento paso a paso" htmlFor="ex-proc" error={errors.procedure} hint="Un paso por línea." className="span-all">
            <textarea id="ex-proc" className="textarea" maxLength={4000} value={form.procedure} onChange={(e) => set('procedure', e.target.value)} />
          </Field>
          <Field label="Indicaciones técnicas (opcional)" htmlFor="ex-cues">
            <textarea id="ex-cues" className="textarea" maxLength={2000} value={form.technicalCues} onChange={(e) => set('technicalCues', e.target.value)} />
          </Field>
          <Field label="Errores comunes (opcional)" htmlFor="ex-mist">
            <textarea id="ex-mist" className="textarea" maxLength={2000} value={form.commonMistakes} onChange={(e) => set('commonMistakes', e.target.value)} />
          </Field>
          <Field label="Equipamiento" htmlFor="ex-eq">
            <input id="ex-eq" className="input" maxLength={80} list="eq-list" value={form.equipment} onChange={(e) => set('equipment', e.target.value)} />
            <datalist id="eq-list">
              {['Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Barra W', 'Kettlebell', 'Banda elástica'].map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
          <Field label="Dificultad" htmlFor="ex-diff">
            <select id="ex-diff" className="select" value={form.difficulty ?? ''} onChange={(e) => set('difficulty', (e.target.value || null) as ExerciseInput['difficulty'])}>
              <option value="">Sin indicar</option>
              {DIFFICULTIES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Patrón de movimiento" htmlFor="ex-pat" className="span-all">
            <input id="ex-pat" className="input" maxLength={80} placeholder="Ej.: bisagra de cadera, empuje vertical…" value={form.movementPattern} onChange={(e) => set('movementPattern', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card stack" aria-labelledby="media-t">
        <div className="card__head" style={{ marginBottom: 0 }}>
          <h2 id="media-t" className="card__title">
            GIF de demostración y encuadre
          </h2>
          {preview && (
            <div className="row">
              <button type="button" className="btn btn--sm" onClick={() => fileInput.current?.click()}>
                <Icon name="upload" size={14} /> Reemplazar archivo
              </button>
              {savedMedia && !pendingFile && (
                <button type="button" className="btn btn--sm btn--danger" onClick={() => setConfirmRemove(true)}>
                  <Icon name="trash" size={14} /> Quitar
                </button>
              )}
            </div>
          )}
        </div>
        {service.mode === 'demo' && (
          <Notice kind="warn" icon="!">
            Modo demo: los archivos que subas se ven solo en esta pestaña (vista previa local) y <strong>no se guardan</strong> en
            ningún servidor. El encuadre sí se conserva mientras dure la demo.
          </Notice>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={config.acceptedMediaTypes.join(',')}
          className="sr-only"
          id="ex-file"
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {!preview ? (
          <div
            className={`dropzone ${over ? 'dropzone--over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <Icon name="upload" size={32} className="gold" />
            <p>Arrastra aquí un GIF vertical u horizontal</p>
            <label htmlFor="ex-file" className="btn btn--outline-gold" style={{ cursor: 'pointer' }}>
              Elegir archivo
            </label>
            <p className="small">GIF (recomendado), MP4 o WebM · máximo {config.maxUploadMb} MB</p>
          </div>
        ) : (
          <>
            {pendingFile && (
              <Notice kind="gold">
                Archivo nuevo seleccionado: <strong>{pendingFile.name}</strong> ({(pendingFile.size / 1048576).toFixed(2)} MB). Se
                subirá al pulsar «Guardar». El archivo original no se modifica: solo se guardan los parámetros de encuadre.
              </Notice>
            )}
            {framingDirty && <Notice kind="warn">Hay cambios de encuadre sin guardar.</Notice>}
            <FramingEditor media={preview} title={form.title || 'Ejercicio'} value={framing} saved={savedFraming} onChange={setFraming} />
          </>
        )}
        {fileError && (
          <p className="field__error" role="alert">
            {fileError}
          </p>
        )}
        {progress !== null && (
          <div className="stack" style={{ ['--stack' as string]: '6px' }} role="status" aria-live="polite">
            <span className="small">
              {service.mode === 'demo' ? 'Preparando vista previa local' : 'Subiendo archivo'}… {progress}%
            </span>
            <div className="progress" aria-hidden="true">
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      <div className="form-actions">
        <Link to="/app/entrenador/ejercicios" className="btn">
          Cancelar
        </Link>
        <button type="submit" className="btn btn--gold btn--lg" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          Guardar ejercicio
        </button>
      </div>

      {confirmRemove && exercise && (
        <ConfirmDialog
          title="Quitar archivo"
          danger
          confirmLabel="Quitar"
          message="Se eliminará el GIF de este ejercicio. Los clientes dejarán de verlo en sus rutinas."
          onCancel={() => setConfirmRemove(false)}
          onConfirm={async () => {
            try {
              await service.removeExerciseMedia(exercise.id);
              setSavedMedia(null);
              setPreview(null);
              setFraming({ ...DEFAULT_FRAMING });
              toast('success', 'Archivo eliminado.');
            } catch (e) {
              toast('error', (e as Error).message);
            }
            setConfirmRemove(false);
          }}
        />
      )}
    </form>
  );
}
