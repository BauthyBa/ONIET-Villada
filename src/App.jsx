import { useMemo, useState } from 'react';
import ReportTable from './components/ReportTable.jsx';
import { useServiceData } from './hooks/useServiceData.js';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
});

const integerFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 0
});

const DATA_FILES = {
  csv: '/data/Datos-ONIET-2025---seguros-prestaciones.csv',
  json: '/data/Datos-ONIET-2025---seguros-prestaciones.json'
};

const PRESET_SOURCES = {
  csv: { type: 'url', format: 'csv', path: DATA_FILES.csv },
  json: { type: 'url', format: 'json', path: DATA_FILES.json }
};

const SOURCE_OPTIONS = [
  { id: 'csv', label: 'Archivo CSV (ejemplo)' },
  { id: 'json', label: 'Archivo JSON (ejemplo)' },
  { id: 'upload', label: 'Archivo local' }
];

const periodsFromYears = (years) => {
  if (!years.length) return 'Sin datos';
  if (years.length === 1) return `${years[0]}`;
  const sorted = [...years].sort((a, b) => a - b);
  return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
};

const buildCompanyReport = (records) => {
  const aggregation = new Map();

  records.forEach((record) => {
    const totalFacturado = record.valorPorServicio * record.cantidadServicios;
    const totalCobertura = totalFacturado * (record.porcentajeCobertura / 100);

    const current = aggregation.get(record.companiaSeguro) ?? {
      id: record.companiaSeguro,
      compania: record.companiaSeguro,
      totalFacturado: 0,
      totalCobertura: 0
    };

    current.totalFacturado += totalFacturado;
    current.totalCobertura += totalCobertura;

    aggregation.set(record.companiaSeguro, current);
  });

  return Array.from(aggregation.values()).sort(
    (a, b) => b.totalCobertura - a.totalCobertura
  );
};

const buildRegionReport = (records) => {
  const aggregation = new Map();

  records.forEach((record) => {
    const current = aggregation.get(record.region) ?? {
      id: record.region,
      region: record.region,
      totalServicios: 0
    };

    current.totalServicios += record.cantidadServicios;
    aggregation.set(record.region, current);
  });

  return Array.from(aggregation.values()).sort(
    (a, b) => b.totalServicios - a.totalServicios
  );
};

const buildSummary = (records) => {
  if (!records.length) {
    return null;
  }

  let totalServicios = 0;
  let totalFacturado = 0;
  let totalCobertura = 0;
  const companias = new Set();
  const regiones = new Set();
  const anios = new Set();

  records.forEach((record) => {
    const facturado = record.valorPorServicio * record.cantidadServicios;
    const cobertura = facturado * (record.porcentajeCobertura / 100);

    totalServicios += record.cantidadServicios;
    totalFacturado += facturado;
    totalCobertura += cobertura;
    companias.add(record.companiaSeguro);
    regiones.add(record.region);
    anios.add(record.anio);
  });

  return {
    totalServicios,
    totalFacturado,
    totalCobertura,
    totalCompanias: companias.size,
    totalRegiones: regiones.size,
    periodo: periodsFromYears(Array.from(anios))
  };
};

function App() {
  const [selectedSource, setSelectedSource] = useState('csv');
  const [uploadedSource, setUploadedSource] = useState(null);
  const [fileError, setFileError] = useState(null);

  const activeSource =
    selectedSource === 'upload'
      ? uploadedSource?.source ?? null
      : PRESET_SOURCES[selectedSource] ?? null;

  const { records, loading, error } = useServiceData(activeSource);

  const summary = useMemo(() => buildSummary(records), [records]);
  const companyReport = useMemo(() => buildCompanyReport(records), [records]);
  const regionReport = useMemo(() => buildRegionReport(records), [records]);

  const handleSourceChange = (event) => {
    const value = event.target.value;
    setSelectedSource(value);
    setFileError(null);
    if (value !== 'upload') {
      setUploadedSource(null);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setUploadedSource(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    let format = null;

    if (extension === 'csv') {
      format = 'csv';
    } else if (extension === 'json') {
      format = 'json';
    }

    if (!format) {
      setUploadedSource(null);
      setFileError('El archivo debe tener extensión .csv o .json');
      event.target.value = '';
      return;
    }

    setFileError(null);
    setUploadedSource({
      name: file.name,
      source: {
        type: 'file',
        format,
        file
      }
    });
    event.target.value = '';
  };

  const uploadPending = selectedSource === 'upload' && !uploadedSource;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Mecánica Argentina · Reportes de Servicios</h1>
        <p>
          Visualice la información de cobertura y distribución de servicios
          prestados según la fuente de datos seleccionada.
        </p>
      </header>

      <section className="card">
        <h2>Fuente de datos</h2>
        <p className="card__lead">
          Utilice los archivos de ejemplo o cargue un archivo propio en formato CSV o
          JSON para generar los reportes.
        </p>
        <div className="data-source">
          {SOURCE_OPTIONS.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name="data-source"
                value={option.id}
                checked={selectedSource === option.id}
                onChange={handleSourceChange}
                aria-label={`Seleccionar ${option.label}`}
              />
              {option.label}
            </label>
          ))}
        </div>
        {selectedSource === 'upload' ? (
          <div className="upload">
            <label className="upload__label" htmlFor="file-input">
              Seleccione un archivo CSV o JSON con el detalle de servicios.
            </label>
            <input
              id="file-input"
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
            />
            {uploadedSource?.name ? (
              <p className="upload__info">Archivo seleccionado: {uploadedSource.name}</p>
            ) : (
              <p className="upload__hint">Aún no se cargó ningún archivo.</p>
            )}
            {fileError ? <p className="status status--error">{fileError}</p> : null}
          </div>
        ) : null}
        {loading ? <p className="status status--loading">Cargando datos…</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}
      </section>

      {summary ? (
        <section className="card summary">
          <h2>Resumen del período</h2>
          <div className="summary__grid">
            <div>
              <span className="summary__label">Período</span>
              <span className="summary__value">{summary.periodo}</span>
            </div>
            <div>
              <span className="summary__label">Servicios totales</span>
              <span className="summary__value">
                {integerFormatter.format(summary.totalServicios)}
              </span>
            </div>
            <div>
              <span className="summary__label">Facturación acumulada</span>
              <span className="summary__value">
                {currencyFormatter.format(summary.totalFacturado)}
              </span>
            </div>
            <div>
              <span className="summary__label">Cobertura aseguradoras</span>
              <span className="summary__value">
                {currencyFormatter.format(summary.totalCobertura)}
              </span>
            </div>
            <div>
              <span className="summary__label">Compañías</span>
              <span className="summary__value">
                {integerFormatter.format(summary.totalCompanias)}
              </span>
            </div>
            <div>
              <span className="summary__label">Regiones</span>
              <span className="summary__value">
                {integerFormatter.format(summary.totalRegiones)}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <ReportTable
        title="Informe de Cobertura"
        description="Ranking de compañías de seguro según el total cubierto."
        columns={[
          { key: 'compania', label: 'Compañía de Seguro' },
          {
            key: 'totalFacturado',
            label: 'Total Facturado [$]',
            render: (value) => currencyFormatter.format(value)
          },
          {
            key: 'totalCobertura',
            label: 'Total cobertura compañía seguro [$]',
            render: (value) => currencyFormatter.format(value)
          }
        ]}
        rows={companyReport}
        emptyMessage={
          loading
            ? 'Cargando información…'
            : uploadPending
              ? 'Seleccione un archivo para generar el reporte.'
              : 'No se encontraron registros para mostrar.'
        }
      />

      <ReportTable
        title="Informe de Regiones"
        description="Ranking de regiones según la cantidad de servicios realizados."
        columns={[
          { key: 'region', label: 'Región' },
          {
            key: 'totalServicios',
            label: 'Cantidad de servicios',
            render: (value) => integerFormatter.format(value)
          }
        ]}
        rows={regionReport}
        emptyMessage={
          loading
            ? 'Cargando información…'
            : uploadPending
              ? 'Seleccione un archivo para generar el reporte.'
              : 'No se encontraron registros para mostrar.'
        }
      />
    </div>
  );
}

export default App;
