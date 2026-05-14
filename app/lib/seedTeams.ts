import type { Team } from "../types";

export const TEAMS: Team[] = [
  // Grupo A
  { id: "mx", name: "México", short_name: "MEX", fifa_code: "MEX", group_name: "A", flag_url: "https://flagcdn.com/w320/mx.png", continent: "North America" },
  { id: "za", name: "África do Sul", short_name: "RSA", fifa_code: "RSA", group_name: "A", flag_url: "https://flagcdn.com/w320/za.png", continent: "Africa" },
  { id: "kr", name: "Coreia do Sul", short_name: "KOR", fifa_code: "KOR", group_name: "A", flag_url: "https://flagcdn.com/w320/kr.png", continent: "Asia" },
  { id: "cz", name: "República Tcheca", short_name: "CZE", fifa_code: "CZE", group_name: "A", flag_url: "https://flagcdn.com/w320/cz.png", continent: "Europe" },

  // Grupo B
  { id: "ca", name: "Canadá", short_name: "CAN", fifa_code: "CAN", group_name: "B", flag_url: "https://flagcdn.com/w320/ca.png", continent: "North America" },
  { id: "ch", name: "Suíça", short_name: "SUI", fifa_code: "SUI", group_name: "B", flag_url: "https://flagcdn.com/w320/ch.png", continent: "Europe" },
  { id: "qa", name: "Qatar", short_name: "QAT", fifa_code: "QAT", group_name: "B", flag_url: "https://flagcdn.com/w320/qa.png", continent: "Asia" },
  { id: "ba", name: "Bósnia e Herzegovina", short_name: "BIH", fifa_code: "BIH", group_name: "B", flag_url: "https://flagcdn.com/w320/ba.png", continent: "Europe" },

  // Grupo C
  { id: "br", name: "Brasil", short_name: "BRA", fifa_code: "BRA", group_name: "C", flag_url: "https://flagcdn.com/w320/br.png", continent: "South America" },
  { id: "ma", name: "Marrocos", short_name: "MAR", fifa_code: "MAR", group_name: "C", flag_url: "https://flagcdn.com/w320/ma.png", continent: "Africa" },
  { id: "gb-sct", name: "Escócia", short_name: "SCO", fifa_code: "SCO", group_name: "C", flag_url: "https://flagcdn.com/w320/gb-sct.png", continent: "Europe" },
  { id: "ht", name: "Haiti", short_name: "HAI", fifa_code: "HAI", group_name: "C", flag_url: "https://flagcdn.com/w320/ht.png", continent: "North America" },

  // Grupo D
  { id: "us", name: "Estados Unidos", short_name: "USA", fifa_code: "USA", group_name: "D", flag_url: "https://flagcdn.com/w320/us.png", continent: "North America" },
  { id: "tr", name: "Turquia", short_name: "TUR", fifa_code: "TUR", group_name: "D", flag_url: "https://flagcdn.com/w320/tr.png", continent: "Asia" },
  { id: "py", name: "Paraguai", short_name: "PAR", fifa_code: "PAR", group_name: "D", flag_url: "https://flagcdn.com/w320/py.png", continent: "South America" },
  { id: "au", name: "Austrália", short_name: "AUS", fifa_code: "AUS", group_name: "D", flag_url: "https://flagcdn.com/w320/au.png", continent: "Oceania" },

  // Grupo E
  { id: "de", name: "Alemanha", short_name: "GER", fifa_code: "GER", group_name: "E", flag_url: "https://flagcdn.com/w320/de.png", continent: "Europe" },
  { id: "ec", name: "Equador", short_name: "ECU", fifa_code: "ECU", group_name: "E", flag_url: "https://flagcdn.com/w320/ec.png", continent: "South America" },
  { id: "cw", name: "Curaçao", short_name: "CUW", fifa_code: "CUW", group_name: "E", flag_url: "https://flagcdn.com/w320/cw.png", continent: "North America" },
  { id: "ci", name: "Costa do Marfim", short_name: "CIV", fifa_code: "CIV", group_name: "E", flag_url: "https://flagcdn.com/w320/ci.png", continent: "Africa" },

  // Grupo F
  { id: "nl", name: "Holanda", short_name: "NED", fifa_code: "NED", group_name: "F", flag_url: "https://flagcdn.com/w320/nl.png", continent: "Europe" },
  { id: "jp", name: "Japão", short_name: "JPN", fifa_code: "JPN", group_name: "F", flag_url: "https://flagcdn.com/w320/jp.png", continent: "Asia" },
  { id: "se", name: "Suécia", short_name: "SWE", fifa_code: "SWE", group_name: "F", flag_url: "https://flagcdn.com/w320/se.png", continent: "Europe" },
  { id: "tn", name: "Tunísia", short_name: "TUN", fifa_code: "TUN", group_name: "F", flag_url: "https://flagcdn.com/w320/tn.png", continent: "Africa" },

  // Grupo G
  { id: "be", name: "Bélgica", short_name: "BEL", fifa_code: "BEL", group_name: "G", flag_url: "https://flagcdn.com/w320/be.png", continent: "Europe" },
  { id: "eg", name: "Egito", short_name: "EGY", fifa_code: "EGY", group_name: "G", flag_url: "https://flagcdn.com/w320/eg.png", continent: "Africa" },
  { id: "nz", name: "Nova Zelândia", short_name: "NZL", fifa_code: "NZL", group_name: "G", flag_url: "https://flagcdn.com/w320/nz.png", continent: "Oceania" },
  { id: "ir", name: "Irã", short_name: "IRN", fifa_code: "IRN", group_name: "G", flag_url: "https://flagcdn.com/w320/ir.png", continent: "Asia" },

  // Grupo H
  { id: "es", name: "Espanha", short_name: "ESP", fifa_code: "ESP", group_name: "H", flag_url: "https://flagcdn.com/w320/es.png", continent: "Europe" },
  { id: "uy", name: "Uruguai", short_name: "URU", fifa_code: "URU", group_name: "H", flag_url: "https://flagcdn.com/w320/uy.png", continent: "South America" },
  { id: "cv", name: "Cabo Verde", short_name: "CPV", fifa_code: "CPV", group_name: "H", flag_url: "https://flagcdn.com/w320/cv.png", continent: "Africa" },
  { id: "sa", name: "Arábia Saudita", short_name: "KSA", fifa_code: "KSA", group_name: "H", flag_url: "https://flagcdn.com/w320/sa.png", continent: "Asia" },

  // Grupo I
  { id: "fr", name: "França", short_name: "FRA", fifa_code: "FRA", group_name: "I", flag_url: "https://flagcdn.com/w320/fr.png", continent: "Europe" },
  { id: "sn", name: "Senegal", short_name: "SEN", fifa_code: "SEN", group_name: "I", flag_url: "https://flagcdn.com/w320/sn.png", continent: "Africa" },
  { id: "no", name: "Noruega", short_name: "NOR", fifa_code: "NOR", group_name: "I", flag_url: "https://flagcdn.com/w320/no.png", continent: "Europe" },
  { id: "iq", name: "Iraque", short_name: "IRQ", fifa_code: "IRQ", group_name: "I", flag_url: "https://flagcdn.com/w320/iq.png", continent: "Asia" },

  // Grupo J
  { id: "ar", name: "Argentina", short_name: "ARG", fifa_code: "ARG", group_name: "J", flag_url: "https://flagcdn.com/w320/ar.png", continent: "South America" },
  { id: "jo", name: "Jordânia", short_name: "JOR", fifa_code: "JOR", group_name: "J", flag_url: "https://flagcdn.com/w320/jo.png", continent: "Asia" },
  { id: "at", name: "Áustria", short_name: "AUT", fifa_code: "AUT", group_name: "J", flag_url: "https://flagcdn.com/w320/at.png", continent: "Europe" },
  { id: "dz", name: "Argélia", short_name: "ALG", fifa_code: "ALG", group_name: "J", flag_url: "https://flagcdn.com/w320/dz.png", continent: "Africa" },

  // Grupo K
  { id: "pt", name: "Portugal", short_name: "POR", fifa_code: "POR", group_name: "K", flag_url: "https://flagcdn.com/w320/pt.png", continent: "Europe" },
  { id: "co", name: "Colômbia", short_name: "COL", fifa_code: "COL", group_name: "K", flag_url: "https://flagcdn.com/w320/co.png", continent: "South America" },
  { id: "cg", name: "Congo", short_name: "COG", fifa_code: "COG", group_name: "K", flag_url: "https://flagcdn.com/w320/cg.png", continent: "Africa" },
  { id: "uz", name: "Uzbequistão", short_name: "UZB", fifa_code: "UZB", group_name: "K", flag_url: "https://flagcdn.com/w320/uz.png", continent: "Asia" },

  // Grupo L
  { id: "gb-eng", name: "Inglaterra", short_name: "ENG", fifa_code: "ENG", group_name: "L", flag_url: "https://flagcdn.com/w320/gb-eng.png", continent: "Europe" },
  { id: "hr", name: "Croácia", short_name: "CRO", fifa_code: "CRO", group_name: "L", flag_url: "https://flagcdn.com/w320/hr.png", continent: "Europe" },
  { id: "pa", name: "Panamá", short_name: "PAN", fifa_code: "PAN", group_name: "L", flag_url: "https://flagcdn.com/w320/pa.png", continent: "North America" },
  { id: "gh", name: "Gana", short_name: "GHA", fifa_code: "GHA", group_name: "L", flag_url: "https://flagcdn.com/w320/gh.png", continent: "Africa" },
];

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export const TEAM_MAP = new Map(TEAMS.map((team) => [team.id, team]));
