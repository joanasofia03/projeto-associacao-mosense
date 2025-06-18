'use client';

type Item = {
  id: number;
  nome: string;
};

type Props = {
  itens: Item[];
};

export default function ExibirItens({ itens }: Props) {
  return (
    <div>
      {itens.map((item) => {
        return <h1 key={item.id}>Olá, {item.nome}</h1>;
      })}
    </div>
  );
}
