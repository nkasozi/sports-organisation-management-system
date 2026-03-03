// Enhanced official service (replacing umpire service)
export interface Official {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  official_type:
    | "referee"
    | "umpire"
    | "judge"
    | "timekeeper"
    | "scorekeeper"
    | "linesman"
    | "assistant_referee";
  certification_level: "junior" | "senior" | "professional" | "international";
  years_experience: number;
  specialization: string;
  availability_status: "available" | "busy" | "unavailable";
  rating: number;
  emergency_contact: string;
  address: string;
  date_of_birth: string;
  certification_expiry: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface CreateOfficialData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  official_type:
    | "referee"
    | "umpire"
    | "judge"
    | "timekeeper"
    | "scorekeeper"
    | "linesman"
    | "assistant_referee";
  certification_level: "junior" | "senior" | "professional" | "international";
  years_experience: number;
  specialization: string;
  availability_status: "available" | "busy" | "unavailable";
  rating: number;
  emergency_contact: string;
  address: string;
  date_of_birth: string;
  certification_expiry: string;
  status: "active" | "inactive" | "suspended";
}

let officials: Official[] = [
  {
    id: "1",
    first_name: "Mark",
    last_name: "Johnson",
    email: "mark.johnson@officials.com",
    phone: "+1-555-0201",
    official_type: "referee",
    certification_level: "professional",
    years_experience: 15,
    specialization: "Football",
    availability_status: "available",
    rating: 4.9,
    emergency_contact: "Sarah Johnson - +1-555-0202",
    address: "456 Official Lane, Sports City, SC 67890",
    date_of_birth: "1978-03-12",
    certification_expiry: "2025-12-31",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class OfficialServiceClass {
  async get_all_officials(): Promise<Official[]> {
    await delay();
    return [...officials];
  }

  async get_available_officials(): Promise<Official[]> {
    await delay();
    return officials.filter(
      (o) => o.availability_status === "available" && o.status === "active",
    );
  }

  async get_official_by_id(id: string): Promise<Official> {
    await delay();
    const official = officials.find((o) => o.id === id);
    if (!official) throw new Error(`Official ${id} not found`);
    return { ...official };
  }

  async create_official(data: CreateOfficialData): Promise<Official> {
    await delay();
    const now = new Date().toISOString();
    const newOfficial: Official = {
      id: Date.now().toString(),
      ...data,
      created_at: now,
      updated_at: now,
    };
    officials.push(newOfficial);
    return { ...newOfficial };
  }

  async update_official(
    id: string,
    data: Partial<CreateOfficialData>,
  ): Promise<Official> {
    await delay();
    const index = officials.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(`Official ${id} not found`);
    const updated = {
      ...officials[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    officials[index] = updated;
    return { ...updated };
  }

  async delete_official(id: string): Promise<boolean> {
    await delay();
    const index = officials.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(`Official ${id} not found`);
    officials.splice(index, 1);
    return true;
  }

  async update_availability(
    id: string,
    status: "available" | "busy" | "unavailable",
  ): Promise<Official> {
    return this.update_official(id, { availability_status: status });
  }
}

export const officialService = new OfficialServiceClass();
