const ReportTable = ({
  title,
  description,
  columns,
  rows,
  emptyMessage,
  onDownload
}) => (
  <section className="report">
    <header className="report__header">
      <div className="report__header-text">
        <h2>{title}</h2>
        {description ? <p className="report__description">{description}</p> : null}
      </div>
      {onDownload ? (
        <button
          type="button"
          className="button report__download"
          onClick={onDownload}
          disabled={!rows.length}
        >
          Descargar PDF
        </button>
      ) : null}
    </header>
    <div className="report__table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="report__empty">
                {emptyMessage ?? 'Sin datos disponibles.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default ReportTable;
