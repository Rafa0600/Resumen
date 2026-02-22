# 📦 Despachos ML

Dashboard de despachos para MercadoLibre — cuentas Mikra y Chaya.

Muestra en tiempo real cuántos paquetes hay para imprimir etiquetas, separados por tipo:

- **🏍️ FLEX** — envíos self_service
- **📦 Recolecta** (Mikra) — cross_docking, ML pasa a buscar
- **📦 Despacho** (Chaya) — xd_drop_off, llevar a punto de despacho

## Uso

1. Abrir `index.html` en el navegador (o deployar en GitHub Pages)
2. Se carga automáticamente al abrir
3. Botón ⟳ Actualizar para refrescar
4. Auto-refresh cada 5 minutos
5. Pull-to-refresh en mobile

## Instalación como PWA

En el celular, abrir la URL y "Agregar a pantalla de inicio". Funciona como app nativa.

## Deploy en GitHub Pages

1. Crear repositorio en GitHub
2. Subir estos archivos
3. Settings → Pages → Source: main branch
4. Acceder en `https://tu-usuario.github.io/despachos-ml/`

## Estructura

```
├── index.html      # App principal
├── manifest.json   # PWA manifest
├── sw.js           # Service Worker (cache offline)
├── icon-192.png    # Ícono PWA 192x192
├── icon-512.png    # Ícono PWA 512x512
└── README.md
```

## Configuración

Los proxies de cada cuenta están configurados en el array `CUENTAS` dentro de `index.html`:

```javascript
const CUENTAS = [
    {
        nombre: 'Mikra',
        proxy: 'https://mikra-flex-proxy.rafaelassir.workers.dev',
        css: 'mikra',
        colectaLabel: 'Recolecta',
        colectaDesc: 'ML pasa a buscar'
    },
    {
        nombre: 'Chaya',
        proxy: 'https://chaya-flex-proxy.rafaelassir.workers.dev',
        css: 'chaya',
        colectaLabel: 'Despacho',
        colectaDesc: 'Llevar a punto'
    }
];
```
