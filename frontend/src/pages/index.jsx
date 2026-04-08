export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-2xl font-bold mb-4">MetaDash</div>
        <div className="text-gray-400">Redirigiendo...</div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const token = context.req.cookies.token;
  if (token) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  return { redirect: { destination: '/login', permanent: false } };
}
