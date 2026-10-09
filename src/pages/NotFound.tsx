import { Link } from 'react-router-dom';
import { BrandMark } from '../components/ui';

export default function NotFound() {
  return (
    <main className="login">
      <div className="login__card" style={{ textAlign: 'center', justifyItems: 'center' }}>
        <BrandMark />
        <h1 className="page-title">Página no encontrada</h1>
        <p className="muted">La dirección no existe o ha cambiado.</p>
        <Link to="/" className="btn btn--gold">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
