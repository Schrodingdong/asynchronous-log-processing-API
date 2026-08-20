interface Statistics {
    totalLines: number,
    errors: number,
    warnings:  number
}

interface LoginRequest {
  username: string,
  password: string
}

interface MyJwtPayload {
  id: number,
  username: string
}
