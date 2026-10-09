# Informe de importación del Excel

Archivo: `Kevin y Rasta plani.xlsx` — generado por `scripts/import-excel.ts`. **No editar a mano**: vuelve a ejecutar `npm run import:excel`.

## Estructura detectada

| Fase | Objetivo | Semanas | Esquemas | Estado (según Excel) |
|---|---|---|---|---|
| Hipertrofia | Generar la maxima hipertrofia. Asi luego podemos pasar al siguiente bloque de volumen. | 1, 2, 3, 4, 5, 6, 7, 8 | 4x10 · 4x10 · 4x9 · 4x9 · 4x8 · 4x8 · 4x8 · «Cierre del bloque hipertrofia» | completado, completado, completado, pendiente, pendiente, pendiente, pendiente, pendiente |
| Volumen | Transicion hacia fuerza.Baja el volumen, sube la intensidad | 9, 10, 11, 12, 13, 14 | «VOLUMEN COMIENZO» · 5x6 · 5x6 · 4x6 · 4x5 · 4x5 | pendiente, pendiente, pendiente, pendiente, pendiente, pendiente |
| Fuerza | Semanas de cargas altas, bajando repeticones, series y aumentando tonelaje. | 15, 16, 17, 18 | 5x4 · 4x3 · 4x3 · 3x3 | pendiente, pendiente, pendiente, pendiente |
| Peaking | _(sin objetivo)_ | 19 | 3x2 | pendiente |
| Tapering | Descarga: menos series, mantene la intensidad | 20 | 2x1 | pendiente |
| Testeo | TESTEO DE RMS PARA TRABAJAR A FUTURO | 21 | 1x1 | pendiente |

Semanas con sesiones: S1 (hoja S1S2), S2 (hoja S1S2), S3 (hoja s3), S4 (hoja S4).

## Notas generales

- Semana 8: la celda E9 ("Cierre del bloque hipertrofia") no es un esquema series×reps; se guarda como nota.
- Semana 9: la celda E10 ("VOLUMEN COMIENZO") no es un esquema series×reps; se guarda como nota.
- La fase "Peaking" no tiene objetivo en el Excel (celda B20 vacía).
- Semana 21: la celda H22 contiene la fórmula "=$B$3" con resultado vacío; ignorada.
- La hoja "S1S2" se aplica a las semanas 1 y 2 (deducido del nombre de la hoja). Ambas semanas reciben la misma prescripción.
- Semanas sin sesiones definidas en el Excel: 5–21. No se han inventado; el entrenador debe completarlas.
- El Excel no indica un objetivo global del mesociclo; solo objetivos por fase (columna "Objetivo del Meso").

## Avisos por ejercicio (202)

| Dónde | Aviso |
|---|---|
| Semana 1 · Sesión 1 | El título de la primera sesión no aparece en la hoja "S1S2"; se ha nombrado "Sesión 1". |
| Semana 1 · Sesión 1 · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 1 · Sesión 1 · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 1 · Sesión 1 · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 1 · Sesión 1 · Sentadilla alta (High Bar) | Tempo leído como hora de Excel (1:02:01) y convertido a 1-2-1. Confirmar. |
| Semana 1 · Sesión 1 · Press plano cerrado | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 1 · Sesión 1 · Press plano cerrado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press de banca agarre cerrado". |
| Semana 1 · Sesión 1 · Inclinado Mancuernas | Peso con varios valores ("24/26/28/30"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 1 · Inclinado Mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press inclinado con mancuernas". |
| Semana 1 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 1 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 1 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 1 · Sesión 2 Sq y Bp variantes · Peso muerto Piernas rigidas | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 1 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 1 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Sentadilla con tempo técnico". |
| Semana 1 · Sesión 2 Sq y Bp variantes · Fondos lastrados o en maquina | Peso con varios valores ("105/maquina"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Repeticiones no numéricas ("BAJADAS"). |
| Semana 1 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Peso con varios valores ("12/10/8/6/4/2"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Elevaciones laterales". |
| Semana 1 · Sesión 2 Sq y Bp variantes · Frances con W parado | Peso con varios valores ("20/ 15"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 2 Sq y Bp variantes · Frances con W parado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press francés con barra W de pie". |
| Semana 1 · Sesión 2 Sq y Bp variantes · Extrension de Triceps | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Extensión de tríceps". |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Peso con varios valores ("D16/ W 30"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Carga sugerida con varios valores ("24/25"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Remo Seal (apoyado) + barra W". |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Rumano mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto rumano con mancuernas". |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Hip Truhst PAUSA | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Hip thrust con pausa". |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso: contiene una referencia a una persona ("kev"); podría ser la carga individual de un atleta. |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso con varios valores ("33-12 kev 33/18"): conservado tal cual, sin interpretar. |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Jalón al pecho amplio + alternado". |
| Semana 1 · Sesión 3 Traccion+ cadena posterior · Flexora Sentado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Curl femoral sentado". |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Sentadilla Zercher | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Peso muerto Deficit | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto en déficit". |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Trapecios Hexagonal | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Encogimientos con barra hexagonal". |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Series no numéricas ("maximo en 5 Minutos"). |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Repeticiones no numéricas ("5 Minutos"). |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Saltos al cajón + EMOM". |
| Semana 1 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Texto de la fila 44 ("SENTADILLAS/ PESO MUERTO HEXAGONAL/ LAGARTIJAS") sin ejercicio propio: se ha añadido a las notas de este ejercicio. |
| Semana 2 · Sesión 1 | El título de la primera sesión no aparece en la hoja "S1S2"; se ha nombrado "Sesión 1". |
| Semana 2 · Sesión 1 · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 2 · Sesión 1 · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 2 · Sesión 1 · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 2 · Sesión 1 · Sentadilla alta (High Bar) | Tempo leído como hora de Excel (1:02:01) y convertido a 1-2-1. Confirmar. |
| Semana 2 · Sesión 1 · Press plano cerrado | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 2 · Sesión 1 · Press plano cerrado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press de banca agarre cerrado". |
| Semana 2 · Sesión 1 · Inclinado Mancuernas | Peso con varios valores ("24/26/28/30"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 1 · Inclinado Mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press inclinado con mancuernas". |
| Semana 2 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 2 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 2 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 2 · Sesión 2 Sq y Bp variantes · Peso muerto Piernas rigidas | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 2 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 2 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Sentadilla con tempo técnico". |
| Semana 2 · Sesión 2 Sq y Bp variantes · Fondos lastrados o en maquina | Peso con varios valores ("105/maquina"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Repeticiones no numéricas ("BAJADAS"). |
| Semana 2 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Peso con varios valores ("12/10/8/6/4/2"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Elevaciones laterales". |
| Semana 2 · Sesión 2 Sq y Bp variantes · Frances con W parado | Peso con varios valores ("20/ 15"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 2 Sq y Bp variantes · Frances con W parado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press francés con barra W de pie". |
| Semana 2 · Sesión 2 Sq y Bp variantes · Extrension de Triceps | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Extensión de tríceps". |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Peso con varios valores ("D16/ W 30"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Carga sugerida con varios valores ("24/25"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Remo Seal (apoyado) + barra W". |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Rumano mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto rumano con mancuernas". |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Hip Truhst PAUSA | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Hip thrust con pausa". |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso: contiene una referencia a una persona ("kev"); podría ser la carga individual de un atleta. |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso con varios valores ("33-12 kev 33/18"): conservado tal cual, sin interpretar. |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Jalón al pecho amplio + alternado". |
| Semana 2 · Sesión 3 Traccion+ cadena posterior · Flexora Sentado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Curl femoral sentado". |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Sentadilla Zercher | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Peso muerto Deficit | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto en déficit". |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Trapecios Hexagonal | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Encogimientos con barra hexagonal". |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Series no numéricas ("maximo en 5 Minutos"). |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Repeticiones no numéricas ("5 Minutos"). |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Saltos al cajón + EMOM". |
| Semana 2 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Texto de la fila 44 ("SENTADILLAS/ PESO MUERTO HEXAGONAL/ LAGARTIJAS") sin ejercicio propio: se ha añadido a las notas de este ejercicio. |
| Semana 3 · Sesión 1 | El título de la primera sesión no aparece en la hoja "s3"; se ha nombrado "Sesión 1". |
| Semana 3 · Sesión 1 · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 3 · Sesión 1 · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 3 · Sesión 1 · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 3 · Sesión 1 · Sentadilla alta (High Bar) | Carga sugerida con varios valores ("75/80"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 1 · Sentadilla alta (High Bar) | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 3 · Sesión 1 · Sentadilla alta (High Bar) | Tempo leído como hora de Excel (1:02:01) y convertido a 1-2-1. Confirmar. |
| Semana 3 · Sesión 1 · Press plano cerrado | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 3 · Sesión 1 · Press plano cerrado | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 3 · Sesión 1 · Press plano cerrado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press de banca agarre cerrado". |
| Semana 3 · Sesión 1 · Sentadilla hack | Peso con varios valores ("45/50"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 1 · Inclinado Mancuernas | Peso con varios valores ("24/26/28/30"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 1 · Inclinado Mancuernas | Carga sugerida con varios valores ("2*45/50/55"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 1 · Inclinado Mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press inclinado con mancuernas". |
| Semana 3 · Sesión 1 · Press Militar Estricto | Peso con varios valores ("40/45"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 1 · Press Militar Estricto | Carga sugerida con varios valores ("30/2*35/40"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 3 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 3 · Sesión 2 Sq y Bp variantes · Peso muerto Piernas rigidas | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 3 · Sesión 2 Sq y Bp variantes · Peso muerto Piernas rigidas | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 3 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Sentadilla con tempo técnico". |
| Semana 3 · Sesión 2 Sq y Bp variantes · Fondos lastrados o en maquina | Peso con varios valores ("115/maquina"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Repeticiones no numéricas ("BAJADAS"). |
| Semana 3 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Peso con varios valores ("12/10/8/6/4/2"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Elevaciones laterales". |
| Semana 3 · Sesión 2 Sq y Bp variantes · Frances con W parado | Peso con varios valores ("20/ 15"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 2 Sq y Bp variantes · Frances con W parado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press francés con barra W de pie". |
| Semana 3 · Sesión 2 Sq y Bp variantes · Extrension de Triceps | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Extensión de tríceps". |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Peso con varios valores ("2x80/85/90"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Carga sugerida con varios valores ("80/90/100"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Peso con varios valores ("D22/W 30"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Carga sugerida con varios valores ("24*26*28/30"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Remo Seal (apoyado) + barra W". |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Rumano mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto rumano con mancuernas". |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Hip Truhst PAUSA | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Hip thrust con pausa". |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso: contiene una referencia a una persona ("kev"); podría ser la carga individual de un atleta. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso con varios valores ("33-12 kev 33/18"): conservado tal cual, sin interpretar. |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Jalón al pecho amplio + alternado". |
| Semana 3 · Sesión 3 Traccion+ cadena posterior · Flexora Sentado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Curl femoral sentado". |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Sentadilla Zercher | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Peso muerto Deficit | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto en déficit". |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Trapecios Hexagonal | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Encogimientos con barra hexagonal". |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Series no numéricas ("maximo en 5 Minutos"). |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Repeticiones no numéricas ("5 Minutos"). |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Saltos al cajón + EMOM". |
| Semana 3 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Texto de la fila 44 ("SENTADILLAS/ PESO MUERTO HEXAGONAL/ LAGARTIJAS") sin ejercicio propio: se ha añadido a las notas de este ejercicio. |
| Semana 4 · Sesión 1 | El título de la primera sesión no aparece en la hoja "S4"; se ha nombrado "Sesión 1". |
| Semana 4 · Sesión 1 · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 4 · Sesión 1 · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 4 · Sesión 1 · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 4 · Sesión 1 · Sentadilla alta (High Bar) | Carga sugerida con varios valores ("75/80"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 1 · Sentadilla alta (High Bar) | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 4 · Sesión 1 · Sentadilla alta (High Bar) | Tempo leído como hora de Excel (1:02:01) y convertido a 1-2-1. Confirmar. |
| Semana 4 · Sesión 1 · Press plano cerrado | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 4 · Sesión 1 · Press plano cerrado | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 4 · Sesión 1 · Press plano cerrado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press de banca agarre cerrado". |
| Semana 4 · Sesión 1 · Sentadilla hack | Peso con varios valores ("45/50"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 1 · Inclinado Mancuernas | Peso con varios valores ("24/26/28/30"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 1 · Inclinado Mancuernas | Carga sugerida con varios valores ("2*45/50/55"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 1 · Inclinado Mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press inclinado con mancuernas". |
| Semana 4 · Sesión 1 · Press Militar Estricto | Peso con varios valores ("40/45"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 1 · Press Militar Estricto | Carga sugerida con varios valores ("30/2*35/40"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 4 · Sesión 2 Sq y Bp variantes · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 4 · Sesión 2 Sq y Bp variantes · Peso muerto Piernas rigidas | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 4 · Sesión 2 Sq y Bp variantes · Peso muerto Piernas rigidas | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?). |
| Semana 4 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Sentadilla Tempo Tecnico | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Sentadilla con tempo técnico". |
| Semana 4 · Sesión 2 Sq y Bp variantes · Fondos lastrados o en maquina | Peso con varios valores ("105/maquina"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Repeticiones no numéricas ("BAJADAS"). |
| Semana 4 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Peso con varios valores ("12/10/8/6/4/2"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Vuelos laterales | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Elevaciones laterales". |
| Semana 4 · Sesión 2 Sq y Bp variantes · Frances con W parado | Peso con varios valores ("20/ 15"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 2 Sq y Bp variantes · Frances con W parado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Press francés con barra W de pie". |
| Semana 4 · Sesión 2 Sq y Bp variantes · Extrension de Triceps | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Extensión de tríceps". |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Peso con varios valores ("2x80/85/90"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Carga sugerida con varios valores ("80/90/100"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Remo Pendlay | Tempo leído como hora de Excel (1:01:01) y convertido a 1-1-1. Confirmar. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Peso con varios valores ("D22/W 30"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Carga sugerida con varios valores ("24*26*28/30"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Remo Seal (APOYADO)+ Barra W | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Remo Seal (apoyado) + barra W". |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Rumano mancuernas | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto rumano con mancuernas". |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Hip Truhst PAUSA | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Hip thrust con pausa". |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso: contiene una referencia a una persona ("kev"); podría ser la carga individual de un atleta. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Peso con varios valores ("33-12 kev 33/18"): conservado tal cual, sin interpretar. |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Jalon al pecho amplio+ Alternado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Jalón al pecho amplio + alternado". |
| Semana 4 · Sesión 3 Traccion+ cadena posterior · Flexora Sentado | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Curl femoral sentado". |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | "SIN DESCANSO" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga. |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Series no numéricas ("4 VUELTAS"). |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Circuito de abdomen | Repeticiones no numéricas ("ELECCION"). |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Sentadilla Zercher | Tempo leído como hora de Excel (3:01:01) y convertido a 3-1-1. Confirmar. |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Peso muerto Deficit | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Peso muerto en déficit". |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Trapecios Hexagonal | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Encogimientos con barra hexagonal". |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Series no numéricas ("maximo en 5 Minutos"). |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Repeticiones no numéricas ("5 Minutos"). |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Nombre conservado del Excel; vinculado al ejercicio de biblioteca "Saltos al cajón + EMOM". |
| Semana 4 · Sesión 4 Sentadilla y Peso muerto · Saltos al cajon+ EMOM 5 | Texto de la fila 44 ("SENTADILLAS/ PESO MUERTO HEXAGONAL/ LAGARTIJAS") sin ejercicio propio: se ha añadido a las notas de este ejercicio. |
