import Head from "next/head";
import Image from 'next/image';
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

export default function Home() {
  const iconSize = 18;

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      <Head>
        <title>Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-grow flex flex-col items-center justify-center gap-4 px-4">
        <Image src="/OsMosenses.png" alt="Logo" width={500} height={500} />
        <h1 className="text-xl text-[#032221] text-center">
          Um sistema informático de apoio à organização de festas e eventos, gerido pela atual comissão de festas.
        </h1>
      </main>
      <footer className="pb-5 text-sm text-gray-800 flex flex-col items-center gap-2">
  <span className="text-sm text-gray-800">Desenvolvido por</span>

  <div className="flex items-center gap-2">
    <span className="font-medium leading-tight">David Moutinho:</span>
    <div className="flex items-center gap-2">
      <a
        href="https://github.com/Moutinho0305"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub de David Moutinho"
        className="text-gray-800 hover:text-black"
      >
        <FaGithub size={iconSize} />
      </a>
      <a
        href="https://www.linkedin.com/in/davidmoutinho/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn de David Moutinho"
        className="text-gray-800 hover:text-black"
      >
        <FaLinkedin size={iconSize} />
      </a>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <span className="font-medium leading-tight">Joana Perpétuo:</span>
    <div className="flex items-center gap-2">
      <a
        href="https://github.com/joanasofia03"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub de Joana Perpétuo"
        className="text-gray-800 hover:text-black"
      >
        <FaGithub size={iconSize} />
      </a>
      <a
        href="https://www.linkedin.com/in/joana-perp%C3%A9tuo-023a8428a/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn de Joana Perpétuo"
        className="text-gray-800 hover:text-black"
      >
        <FaLinkedin size={iconSize} />
      </a>
    </div>
  </div>
</footer>

    </div>
  );
}
