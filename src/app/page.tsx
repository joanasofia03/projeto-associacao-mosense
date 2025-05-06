import Head from "next/head";
import Image from 'next/image';

export default function Home() {
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center flex-col bg-gray-200 gap-2">
      <Image src="/OsMosenses.png" alt="Logo" width={500} height={500} />
        <h1 className="text-xl text-[#032221] pt-10">Um sistema informático de apoio à organização de festas e eventos, gerido pela atual comissão de festas.</h1>
        <span className="text-sm text-gray-600">Desenvolvido por David Moutinho e Joana Perpétuo</span>
      <Head>
        <title>Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </div>
  );
}
