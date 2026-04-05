import { faker } from "@faker-js/faker";

const SPORT_OPTIONS = [
  "Football",
  "Basketball",
  "Tennis",
  "Soccer",
  "Baseball",
  "Hockey",
];
const SPECIALIZATION_OPTIONS = [
  "Football",
  "Basketball",
  "Tennis",
  "Soccer",
  "Baseball",
];

export function generate_fake_string_value(
  field_name: string,
  display_name: string,
): string {
  if (field_name.includes("email")) return faker.internet.email();
  if (field_name.includes("phone") || field_name.includes("contact"))
    return faker.phone.number();
  if (field_name.includes("first_name") || field_name.includes("firstname"))
    return faker.person.firstName();
  if (field_name.includes("last_name") || field_name.includes("lastname"))
    return faker.person.lastName();
  if (
    field_name.includes("name") &&
    !field_name.includes("user") &&
    !field_name.includes("file")
  )
    return faker.company.name();
  if (field_name.includes("address")) return faker.location.streetAddress();
  if (field_name.includes("website") || field_name.includes("url"))
    return faker.internet.url();
  if (field_name.includes("description") || field_name.includes("desc"))
    return faker.lorem.sentences(2);
  if (field_name.includes("title")) return faker.lorem.words(3);
  if (field_name.includes("position")) return faker.person.jobTitle();
  if (field_name.includes("venue") || field_name.includes("location"))
    return faker.location.city() + " Stadium";
  if (field_name.includes("coach")) return faker.person.fullName();
  if (field_name.includes("sport"))
    return faker.helpers.arrayElement(SPORT_OPTIONS);
  if (field_name.includes("color")) return faker.internet.color();
  if (field_name.includes("specialization"))
    return faker.helpers.arrayElement(SPECIALIZATION_OPTIONS);
  if (field_name.includes("emergency"))
    return faker.person.fullName() + " - " + faker.phone.number();
  return faker.lorem.words(2);
}

export function generate_fake_number_value(field_name: string): number {
  if (field_name.includes("year"))
    return faker.date
      .between({ from: "1950-01-01", to: "2024-12-31" })
      .getFullYear();
  if (field_name.includes("age")) return faker.number.int({ min: 18, max: 65 });
  if (field_name.includes("experience"))
    return faker.number.int({ min: 0, max: 30 });
  if (field_name.includes("score"))
    return faker.number.int({ min: 0, max: 10 });
  if (field_name.includes("jersey"))
    return faker.number.int({ min: 1, max: 99 });
  if (field_name.includes("rating"))
    return faker.number.int({ min: 1, max: 5 });
  if (field_name.includes("max_teams"))
    return faker.number.int({ min: 4, max: 32 });
  if (field_name.includes("duration"))
    return faker.number.int({ min: 60, max: 120 });
  return faker.number.int({ min: 1, max: 100 });
}

export function generate_fake_date_value(field_name: string): string {
  if (field_name.includes("birth"))
    return faker.date
      .between({ from: "1970-01-01", to: "2005-12-31" })
      .toISOString()
      .split("T")[0];
  if (field_name.includes("founded"))
    return faker.date
      .between({ from: "1900-01-01", to: "2020-12-31" })
      .toISOString()
      .split("T")[0];
  if (field_name.includes("start"))
    return faker.date.future().toISOString().split("T")[0];
  if (field_name.includes("end"))
    return faker.date.future({ years: 1 }).toISOString().split("T")[0];
  if (field_name.includes("expiry"))
    return faker.date.future({ years: 2 }).toISOString().split("T")[0];
  if (field_name.includes("registration") || field_name.includes("deadline"))
    return faker.date.future({ years: 0.08 }).toISOString().split("T")[0];
  if (field_name.includes("scheduled"))
    return faker.date.future({ years: 0.2 }).toISOString().split("T")[0];
  return faker.date.future().toISOString().split("T")[0];
}
