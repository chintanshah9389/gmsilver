export const ADMIN_PAGE_SIZE = 100;
export const ADMIN_PAGE_SIZE_OPTIONS = [50, 100] as const;

export const defaultAdminPaginationModel = {
  page: 0,
  pageSize: ADMIN_PAGE_SIZE,
};

export function toApiPage(paginationModel: { page: number; pageSize: number }) {
  return {
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
  };
}
