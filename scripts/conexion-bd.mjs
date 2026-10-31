import pg from "pg";

const { Client } = pg;

function crearCliente(connectionString) {
  const connection = new URL(connectionString);
  connection.searchParams.delete("sslmode");

  return new Client({
    connectionString: connection.toString(),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
  });
}

function esFalloDeConexion(error) {
  return (
    ["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ETIMEDOUT"].includes(
      error.code,
    ) || error.message === "timeout expired"
  );
}

export async function conectarBaseDatos() {
  const cadenaPrincipal = process.env.CASAMATUTELAYANA_POSTGRES_URL;
  if (!cadenaPrincipal) {
    throw new Error("Falta la variable CASAMATUTELAYANA_POSTGRES_URL.");
  }

  const clientePrincipal = crearCliente(cadenaPrincipal);
  try {
    await clientePrincipal.connect();
    return clientePrincipal;
  } catch (error) {
    const cadenaDirecta = process.env.CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING;
    if (!esFalloDeConexion(error) || !cadenaDirecta || cadenaDirecta === cadenaPrincipal) {
      throw error;
    }

    console.warn(
      `No se pudo conectar con CASAMATUTELAYANA_POSTGRES_URL (${error.code ?? "timeout"}); se usará CASAMATUTELAYANA_POSTGRES_URL_NON_POOLING.`,
    );

    const clienteDirecto = crearCliente(cadenaDirecta);
    await clienteDirecto.connect();
    return clienteDirecto;
  }
}
