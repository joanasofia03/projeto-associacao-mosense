import Head from "next/head";

export default function Home() {
  return (
    <div className="w-full overflow-hidden flex items-center justify-center flex-col bg-gray-200">
      Info
      <Head>
        <title>Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </div>
  );
}
