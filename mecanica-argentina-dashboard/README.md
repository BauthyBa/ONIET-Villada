# Mecánica Argentina · Reportes de Servicios

Aplicación React que procesa los datos históricos de prestaciones de Mecánica Argentina y genera los reportes solicitados:

- **Informe de Cobertura:** ranking de compañías de seguros ordenado según el total cubierto.
- **Informe de Regiones:** ranking de regiones por cantidad de servicios realizados.

Los datos se cargan desde los archivos provistos por la consigna (`CSV` o `JSON`) y se procesan en el navegador, sin necesidad de una base de datos.

## Requisitos

- Node.js 18 o superior (probado con Node 20.19.4)
- npm 9 o superior

## Puesta en marcha

```bash
cd mecanica-argentina-dashboard
npm install
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173/` por defecto. Utilice el selector de fuente de datos para alternar entre los archivos `CSV` y `JSON`.

En la opción **Archivo local** puede cargar un archivo propio (`.csv` o `.json`) con la misma estructura de campos para generar los reportes dinámicamente.

### Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo de Vite.
- `npm run build`: genera la versión optimizada para producción en la carpeta `dist/`.
- `npm run preview`: sirve la versión compilada para validación local.

## Organización del código

- `src/hooks/useServiceData.js`: descarga y normaliza los registros desde el archivo seleccionado.
- `src/App.jsx`: orquesta el procesamiento y presentación de los reportes.
- `src/components/ReportTable.jsx`: componente reutilizable para renderizar las tablas.
- `public/data/`: contiene los archivos originales provistos por la consigna.

## Notas

- Los cálculos de facturación y cobertura se realizan en base a los campos `ValorPorServicio`, `CantidadServicios` y `PorcentajeCobertura`.
- El orden del ranking de compañías utiliza el total de cobertura de mayor a menor, tal como se solicitó.
- Se incluyen indicadores resumen para facilitar el análisis del período completo.
