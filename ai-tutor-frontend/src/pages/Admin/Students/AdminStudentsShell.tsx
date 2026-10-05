export function AdminStudentsShell() {
  return (
    <section className="mx-auto max-w-[1320px]" aria-labelledby="admin-students-title">
      <nav className="mb-1 text-xs text-[#667085]" aria-label="Breadcrumb">
        <span>Quản trị hệ thống</span><span aria-hidden="true"> / </span><span>Học sinh</span><span aria-hidden="true"> / </span><strong className="font-semibold text-[#181c22]">Danh sách học sinh</strong>
      </nav>
      <h1 id="admin-students-title" className="text-2xl font-bold leading-8 text-[#181c22] sm:text-[28px]">Quản lý học sinh</h1>
      <p className="mt-1 max-w-xl text-sm leading-6 text-[#667085]">Theo dõi tài khoản, lớp học và tiến trình cơ bản của học sinh.</p>
    </section>
  );
}
