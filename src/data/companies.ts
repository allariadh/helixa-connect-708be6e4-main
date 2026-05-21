export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  description: string;
  services: string[];
  location: string;
  website: string;
  phone: string;
  email: string;
  employees: string;
  founded: string;
}

export const algerianCompanies: Company[] = [
  { 
    id: "sonatrach",
    name: "Sonatrach", 
    logo: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=100&h=100&fit=crop", 
    industry: "Energy",
    description: "Algeria's national oil and gas company, one of the largest in Africa and a major player in the global energy market.",
    services: ["Oil & Gas Exploration", "Petroleum Refining", "Pipeline Transportation", "Natural Gas Liquefaction"],
    location: "Algiers, Algeria",
    website: "www.sonatrach.com",
    phone: "+213 21 54 70 00",
    email: "contact@sonatrach.dz",
    employees: "50,000+",
    founded: "1963"
  },
  { 
    id: "djezzy",
    name: "Djezzy", 
    logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop", 
    industry: "Telecom",
    description: "Leading mobile telecommunications operator in Algeria, providing innovative digital services to millions of subscribers.",
    services: ["Mobile Communications", "4G/5G Networks", "Digital Services", "Enterprise Solutions"],
    location: "Algiers, Algeria",
    website: "www.djezzy.dz",
    phone: "+213 770 000 000",
    email: "contact@djezzy.dz",
    employees: "3,000+",
    founded: "2001"
  },
  { 
    id: "cevital",
    name: "Cevital", 
    logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=100&h=100&fit=crop", 
    industry: "Industry",
    description: "Algeria's largest private company, a diversified industrial group with interests in food processing, electronics, and more.",
    services: ["Food Processing", "Sugar Refining", "Electronics Manufacturing", "Steel Production"],
    location: "Béjaïa, Algeria",
    website: "www.cevital.com",
    phone: "+213 34 20 20 20",
    email: "contact@cevital.com",
    employees: "18,000+",
    founded: "1998"
  },
  { 
    id: "condor",
    name: "Condor", 
    logo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=100&h=100&fit=crop", 
    industry: "Electronics",
    description: "Leading Algerian electronics and home appliances manufacturer with a strong presence across North Africa.",
    services: ["Consumer Electronics", "Home Appliances", "Mobile Devices", "Air Conditioning"],
    location: "Bordj Bou Arréridj, Algeria",
    website: "www.condor.dz",
    phone: "+213 35 68 54 00",
    email: "contact@condor.dz",
    employees: "8,000+",
    founded: "2002"
  },
  { 
    id: "mobilis",
    name: "Mobilis", 
    logo: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop", 
    industry: "Telecom",
    description: "Algeria's first mobile operator and a subsidiary of Algérie Télécom, serving millions across the country.",
    services: ["Mobile Services", "Internet Solutions", "Fixed-Line Services", "Corporate Packages"],
    location: "Algiers, Algeria",
    website: "www.mobilis.dz",
    phone: "+213 661 000 000",
    email: "contact@mobilis.dz",
    employees: "5,000+",
    founded: "2003"
  },
  { 
    id: "air-algerie",
    name: "Air Algérie", 
    logo: "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=100&h=100&fit=crop", 
    industry: "Aviation",
    description: "The national airline of Algeria, connecting the country to destinations across Africa, Europe, and beyond.",
    services: ["Passenger Flights", "Cargo Services", "Charter Flights", "Maintenance Services"],
    location: "Algiers, Algeria",
    website: "www.airalgerie.dz",
    phone: "+213 21 98 63 63",
    email: "contact@airalgerie.dz",
    employees: "9,000+",
    founded: "1947"
  },
];
