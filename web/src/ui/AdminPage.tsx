const AdminPage = () => {
  return (
    <section className="panel admin-panel">
      <div className="panel-header">
        <h2>管理后台</h2>
        <span className="status-line">/admin</span>
      </div>
      <div className="admin-embed">
        <iframe title="admin" src="/admin" />
      </div>
    </section>
  );
};

export default AdminPage;
