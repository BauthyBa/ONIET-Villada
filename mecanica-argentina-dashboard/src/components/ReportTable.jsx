const ReportTable = ({ title, description, columns, rows, emptyMessage }) => (
  <section className="report">
    <header className="report__header">
      <h2>{title}</h2>
      {description ? <p className="report__description">{description}</p> : null}
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
