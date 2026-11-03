# S3-US1 — Admin documents / RAG

Ngày 02/11/2026. Phạm vi: dùng lại DocumentController, AdminDocumentController, DocumentLifecycleService và ingestion pipeline. Không tạo CRUD song song, không mở retry UI/bulk action/OCR mới. Story chưa Accepted/Done; staging/provider E2E và PO còn mở.

## Contract triển khai

- GET /api/v1/documents/page: Admin/Teacher, page 1-based, size mặc định 20/max 50, sort createdAt DESC + id; search theo title/fileName/creatorName, subject, gradeLevel, status enum, creatorId UUID. Admin xem mọi owner; Teacher bị ép owner từ principal dù gửi creatorId khác. Response PageResponseDTO gồm content/page/size/totalElements/totalPages. Giữ GET /documents cũ tương thích Teacher.
- DTO thêm fileSize/fileType/creatorId/creatorName, giữ title/fileName/subject/grade/status/progress/createdAt. Query fetch creator/lesson để tránh N+1. Không trả entity/password/token; errorMessage được thay bằng thông báo an toàn, dùng document ID để tra log.
- POST /api/v1/admin/documents/ingest/pdf: reuse endpoint Admin/Teacher, multipart file/subject/gradeLevel; 201 data=UUID tài liệu để theo dõi. Giữ hỗ trợ supplement PDF/DOCX/TXT/MD tối đa 50MB theo validator hiện có; PDF kiểm tra signature, MIME/extension; tên file chặn path separator/control chars và >255. Subject/grade được normalize trước upload. UI nói rõ giới hạn; lỗi server là nguồn xác thực cuối.
- PUT /documents/{id}/metadata và DELETE /documents/{id}: Admin mọi owner, Teacher chỉ owner. Validate title/subject/grade theo quy tắc curriculum. Metadata đồng bộ vào mọi chunk trong cùng transaction. Xóa chunk/document cùng transaction; retrieval JOIN documents nên không còn lấy vector đã xóa. Giữ chat/citation lịch sử, không sửa history.

## Lifecycle / độ tin cậy

Publish Rabbit chỉ sau commit tài liệu, tránh worker không tìm thấy hàng chưa commit. Publish lỗi giữ PROCESSING để phục hồi, không trả lỗi tạo account/tài liệu gây hiểu nhầm đã rollback. Worker khóa hàng Document; bỏ qua SUCCESS/FAILED hoặc tài liệu đã xóa; xóa chunks cũ trong transaction trước ghi mới. Hai job cùng ID serialize, tránh duplicate vector; lỗi pipeline rollback chunks và listener ghi FAILED trong transaction riêng. Lỗi thông báo WebSocket không làm rollback dữ liệu nghiệp vụ.

DocumentRecoveryJob quét tối đa 50 PROCESSING cũ hơn 5 phút mỗi 5 phút và gửi lại Rabbit từ file gốc đã lưu; restart/broker failure trước enqueue có thể phục hồi. Không có retry FAILED tự động hoặc nút retry UI. Queue có thể nhận job trùng; worker guard xử lý idempotent. Giới hạn: khóa hàng trong lúc provider chạy; timeout embedding hiện có 2 phút mỗi call, nhiều batch có thể lâu hơn. Recovery không phải deadline tổng job; chưa kiểm chứng crash/restart với broker thật. Theo dõi queue backlog và stuck rows trên staging trước nghiệm thu ADM-304.

Hai native vector queries (filtered/unfiltered) đã sửa để JOIN documents và bắt buộc status SUCCESS. PROCESSING/FAILED không retrieval được, kể cả có vector cũ. Metadata filter dùng cột Document, đồng bộ metadata JSON cho citation. Mục này là sửa lỗi thực tế phát hiện khi review.

Xóa file ngoài DB: cố gắng xóa storage, nếu lỗi ghi log và vẫn xóa DB/vector để ngừng retrieval. Có thể còn orphan object khi storage lỗi; dọn thủ công theo log, không giả vờ có distributed transaction. Upload storage thành công nhưng DB rollback cũng có thể để orphan file; chưa có durable storage cleanup job. File gốc của FAILED được giữ để chẩn đoán.

## UI

Route /admin/documents, menu bỏ placeholder; upload có pending guard, form multipart, notice ID; list/search/status/subject/grade, phân trang, metadata/creator, loading/empty/error/retry; polling 10 giây khi page có PROCESSING, abort và clear timer khi rời trang. Sửa và confirm xóa bằng native dialog, disable khi pending; error hiện trong dialog và trang. Không hard-code progress phần trăm khi backend chưa persist từng bước; trạng thái PROCESSING là nguồn chính. Giao diện tái sử dụng theme và controls native; cần browser keyboard/mobile visual QA. Không rebuild Docker đang chạy; phải docker compose up -d --build ai-tutor-service ai-tutor-frontend để localhost:3000 dùng source mới.

## Kiểm chứng

- Frontend npm run build: pass. npm run lint: exit 0, còn warnings repo. adminDocuments.test.mjs: 1 pass (empty/auth request/error/retry/unmount abort); bộ regression frontend Admin 16/16 pass sau build cuối. CI thêm test này.
- PostgreSQL test documentPaginationAndRetrievalOnlyReturnSuccessfulSurvivingDocuments: ba trạng thái có vector thật 1024 chiều, page/count/owner scope, retrieval chỉ SUCCESS, sửa subject chuyển filter, delete loại retrieval.
- Unit regression DocumentLifecycleServiceTest kiểm tra ownership, sync chunk metadata, storage delete failure; fixture cập nhật findById→lockById. DocumentIngestionFailureTest kiểm tra provider exception không lưu chunks, listener markFailed, job SUCCESS trùng không gọi embedding.
- HTTP documentRoutesEnforceRolesAndPagination chạy Spring Security thật: anonymous 401, Student 403, malformed page/size/status 400 và Admin page response.
- Full backend lần trước: 467 tests, 1 fail (query null search bị PostgreSQL suy ra bytea). Đã sửa cast search sang string và chạy lại targeted; targeted run cuối BUILD SUCCESSFUL: 30 tests, 0 failures. Full regression cuối: BUILD SUCCESSFUL, 469 tests, 428 pass, 41 skipped, 0 failure. Report: ai-tutor-service/build/reports/tests/test/index.html. Tests skipped không được tính là kiểm chứng. Không ghi pass cho lần thất bại.

## Gate còn mở

ADM-304 cần crash/restart/broker timeout test thật và xác nhận job không kẹt theo chính sách vận hành. ADM-308 cần upload→extract→embedding→retrieval E2E, timeout provider, ownership HTTP cho mutations, regression Teacher/UI đầy đủ. ADM-309 cần OpenAPI artifact từ app chạy, remote CI/merge, staging, PDF fixture nghiệm thu và PO sign-off. Không tự tick các task này khi mới có implementation/test từng phần. Không có schema migration mới; PostgreSQL fixture chạy baseline V1..V9.
