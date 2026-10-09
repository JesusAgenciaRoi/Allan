# Procedencia de los recursos gráficos

| Recurso | Origen | Notas |
|---|---|---|
| `public/brand/af-logo-*.{webp,png}`, `favicon.png` | Logotipo de AF Team incrustado en la hoja `MESOCICLO` del Excel proporcionado por el cliente. | Marca propia del cliente. |
| `public/media/hero-athlete*.{webp,jpg}` | Recorte de la mitad derecha de la imagen de referencia proporcionada (`WhatsApp Image 2026-10-06 at 5.44.16 PM.jpeg`), sin el titular. | **Confirmar los derechos de uso** antes de producción (la imagen parece una composición generada). Si no se pueden confirmar, sustituirla por una foto propia con la misma composición: atleta de espaldas en un gimnasio oscuro. |
| `public/media/grunge.png` | Generada por `scripts/generate-assets.py` (ruido procedural). | Sin derechos de terceros. |
| `public/media/exercises/*.gif` | Animaciones esquemáticas generadas por `scripts/generate-assets.py`. Hay versiones verticales (360×480) y horizontales (480×300) para probar el encuadre. | Sin derechos de terceros. Sustituir por demostraciones reales. |
| Fuentes Bebas Neue, Barlow, Barlow Condensed | Google Fonts. | Licencia SIL Open Font License. |

Para regenerar los recursos: `python scripts/generate-assets.py`. Necesita Pillow, el Excel en la raíz y la referencia en `reference/referencia-hero.jpeg`.
