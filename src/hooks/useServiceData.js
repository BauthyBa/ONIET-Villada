import { useEffect, useState } from 'react';

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
    let isCancelled = false;
    const controller = source?.type === 'url' ? new AbortController() : null;

    const loadData = async () => {
      if (!source) {
        setRecords([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let rawRecords = [];

        if (source.type === 'url') {
          const response = await fetch(source.path, {
            signal: controller?.signal
          });
          if (!response.ok) {
            throw new Error('No se pudo descargar el archivo de datos.');
          }
          const text = await response.text();
          rawRecords = source.format === 'csv' ? parseCsv(text) : parseJson(text);
        } else if (source.type === 'file') {
          const text = await source.file.text();
          rawRecords = source.format === 'csv' ? parseCsv(text) : parseJson(text);
        } else if (source.type === 'text') {
          rawRecords =
            source.format === 'csv'
              ? parseCsv(source.content)
              : parseJson(source.content);
        } else {
          throw new Error('Fuente de datos desconocida.');
        }

        const normalized = rawRecords.map(normalizeRecord);
        if (!isCancelled) {
          setRecords(normalized);
        }
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError' && !isCancelled) {
          console.error(fetchError);
          setError(fetchError.message ?? 'Ocurrió un error desconocido.');
          setRecords([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
      controller?.abort();
    };
  }, [source]);

  return { records, loading, error };
};
