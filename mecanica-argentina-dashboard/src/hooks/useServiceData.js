import { useEffect, useState } from 'react';

const DATA_PATHS = {
  csv: '/data/Datos-ONIET-2025---seguros-prestaciones.csv',
  json: '/data/Datos-ONIET-2025---seguros-prestaciones.json'
};

const HEADERS = [
  'NumeroRegistro',
  'CompaniaSeguro',
  'Anio',
  'Mes',
  'CantidadServicios',
  'Region',
  'ValorPorServicio',
  'PorcentajeCobertura'
];

const sanitizeBOM = (content) => content.replace(/^\uFEFF/, '');

const parseCsv = (text) => {
  const cleaned = sanitizeBOM(text).trim();
  if (!cleaned) {
    return [];
  }

  const [headerLine, ...rows] = cleaned.split(/\r?\n/);
  const headers = headerLine.split(',').map((value) => value.trim());

  return rows
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const cells = row.split(',');
      return headers.reduce((record, header, index) => {
        record[header] = cells[index]?.trim() ?? '';
        return record;
      }, {});
    });
};

const parseJson = (text) => {
  const cleaned = sanitizeBOM(text);
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error al parsear JSON:', error);
    throw new Error('No se pudo interpretar el archivo JSON.');
  }
};

const normalizeRecord = (raw) => {
  const missingHeader = HEADERS.find((header) => !(header in raw));
  if (missingHeader) {
    throw new Error(`Falta el campo ${missingHeader} en los datos.`);
  }

  const numeroRegistro = Number(raw.NumeroRegistro);
  const anio = Number(raw.Anio);
  const mes = Number(raw.Mes);
  const cantidadServicios = Number(raw.CantidadServicios);
  const valorPorServicio = Number(raw.ValorPorServicio);
  const porcentajeCobertura = Number(raw.PorcentajeCobertura);

  if (
    Number.isNaN(numeroRegistro) ||
    Number.isNaN(anio) ||
    Number.isNaN(mes) ||
    Number.isNaN(cantidadServicios) ||
    Number.isNaN(valorPorServicio) ||
    Number.isNaN(porcentajeCobertura)
  ) {
    throw new Error('Se encontraron valores numéricos inválidos en los datos.');
  }

  return {
    numeroRegistro,
    companiaSeguro: String(raw.CompaniaSeguro).trim(),
    anio,
    mes,
    cantidadServicios,
    region: String(raw.Region).trim(),
    valorPorServicio,
    porcentajeCobertura
  };
};

export const useServiceData = (source) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const path = DATA_PATHS[source];
        if (!path) {
          throw new Error('Fuente de datos desconocida.');
        }

        const response = await fetch(path, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('No se pudo descargar el archivo de datos.');
        }

        let rawRecords = [];
        if (source === 'csv') {
          const text = await response.text();
          rawRecords = parseCsv(text);
        } else {
          const text = await response.text();
          rawRecords = parseJson(text);
        }

        const normalized = rawRecords.map(normalizeRecord);
        setRecords(normalized);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error(fetchError);
          setError(fetchError.message ?? 'Ocurrió un error desconocido.');
          setRecords([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [source]);

  return { records, loading, error };
};
