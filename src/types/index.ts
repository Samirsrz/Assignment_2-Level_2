
export interface USER{
  
    name:string,
    email:string,
    password:string,
    role?:"contributor"|"maintainer"
}

export const USER_ROLE={
    contributor:"contributor",
    maintainer:"maintainer",
}as const

export type ROLES="maintainer" | "contributor"