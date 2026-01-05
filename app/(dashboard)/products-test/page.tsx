export default function ProductsTestPage() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          Teste de rota /products-test
        </h1>
        <p>
          Esta é uma rota de teste para validar se o redirect 307 é específico da rota /products ou global.
        </p>
      </div>
    </div>
  )
}

