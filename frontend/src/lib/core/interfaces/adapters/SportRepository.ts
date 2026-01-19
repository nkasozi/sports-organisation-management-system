import type { FilterableRepository } from "./Repository";
import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
} from "../../entities/Sport";

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
