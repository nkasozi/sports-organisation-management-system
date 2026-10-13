enum LAZY_REPOSITORY_STATUS {
  UNINITIALIZED = "uninitialized",
  READY = "ready",
}

type LazyRepositoryState<TRepository> =
  | { status: LAZY_REPOSITORY_STATUS.UNINITIALIZED }
  | { status: LAZY_REPOSITORY_STATUS.READY; repository: TRepository };

export function create_lazy_repository_accessor<TRepository>(
  create_repository: () => TRepository,
): () => TRepository {
  let state: LazyRepositoryState<TRepository> = {
    status: LAZY_REPOSITORY_STATUS.UNINITIALIZED,
  };

  return (): TRepository => {
    switch (state.status) {
      case LAZY_REPOSITORY_STATUS.READY:
        return state.repository;
      case LAZY_REPOSITORY_STATUS.UNINITIALIZED: {
        const repository = create_repository();
        state = { status: LAZY_REPOSITORY_STATUS.READY, repository };
        return repository;
      }
    }
  };
}
