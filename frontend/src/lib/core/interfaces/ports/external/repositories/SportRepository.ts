import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "../../../../entities/Sport";
import type { FilterableRepository } from "./Repository";

export interface SportFilter {
  name_contains?: string;
  status?: Sport["status"];
}

export type SportRepository = FilterableRepository<
  Sport,
  CreateSportInput,
  UpdateSportInput,
  SportFilter
>;
