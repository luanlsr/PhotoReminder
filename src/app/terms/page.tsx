import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Servico | Photo Reminder",
  description: "Termos de Servico do Photo Reminder.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf9f8] px-5 py-10 text-[#2c2a2a]">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#a77962]">
          Photo Reminder
        </p>
        <h1 className="font-serif text-3xl text-[#2c2a2a] sm:text-4xl">
          Termos de Servico
        </h1>
        <p className="mt-4 text-sm text-stone-500">
          Ultima atualizacao: 12 de outubro de 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700 sm:text-base">
          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Uso do aplicativo</h2>
            <p className="mt-2">
              O Photo Reminder foi criado para convidados compartilharem fotos, videos, comentarios
              e mensagens relacionados ao casamento. Ao usar o aplicativo, voce concorda em enviar
              apenas conteudos apropriados e relacionados ao evento.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Conteudo enviado</h2>
            <p className="mt-2">
              Voce continua responsavel pelas fotos, videos e mensagens que enviar. Ao publicar
              conteudo no album, voce permite que ele seja exibido aos noivos e demais convidados
              dentro da experiencia do Photo Reminder.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Acesso e disponibilidade</h2>
            <p className="mt-2">
              Podemos limitar, suspender ou remover conteudos que prejudiquem a experiencia,
              exponham terceiros indevidamente ou estejam fora do objetivo do album.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Privacidade</h2>
            <p className="mt-2">
              O uso das informacoes pessoais e descrito na nossa{" "}
              <Link className="font-semibold text-[#8b5f4d] underline" href="/privacy">
                Politica de Privacidade
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Contato</h2>
            <p className="mt-2">
              Para duvidas sobre estes termos, entre em contato:
              {" "}
              <a className="font-semibold text-[#8b5f4d] underline" href="mailto:luan.ramalhosilva@gmail.com">
                luan.ramalhosilva@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex rounded-full bg-[#2c2a2a] px-5 py-3 text-sm font-semibold text-white"
        >
          Voltar para o inicio
        </Link>
      </article>
    </main>
  );
}
