import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidade | Photo Reminder",
  description: "Politica de Privacidade do Photo Reminder.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf9f8] px-5 py-10 text-[#2c2a2a]">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#a77962]">
          Photo Reminder
        </p>
        <h1 className="font-serif text-3xl text-[#2c2a2a] sm:text-4xl">
          Politica de Privacidade
        </h1>
        <p className="mt-4 text-sm text-stone-500">
          Ultima atualizacao: 12 de outubro de 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700 sm:text-base">
          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Dados coletados</h2>
            <p className="mt-2">
              O Photo Reminder usa login com Google para identificar convidados. Ao entrar,
              podemos receber seu nome, e-mail e foto de perfil fornecidos pela sua conta Google.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Uso das informacoes</h2>
            <p className="mt-2">
              Usamos esses dados apenas para permitir acesso ao album, identificar quem enviou
              fotos, videos, curtidas, comentarios e mensagens, e manter a experiencia organizada
              para os convidados.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Fotos, videos e mensagens</h2>
            <p className="mt-2">
              As midias e mensagens enviadas pelos convidados podem ser exibidas dentro do album do
              casamento. Nao vendemos essas informacoes e nao as usamos para publicidade.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Compartilhamento</h2>
            <p className="mt-2">
              As informacoes podem ser armazenadas em servicos usados para operar o aplicativo,
              como hospedagem, banco de dados e armazenamento de arquivos. Esses servicos sao usados
              somente para manter o Photo Reminder funcionando.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#2c2a2a]">Contato</h2>
            <p className="mt-2">
              Para solicitar remocao de dados ou tirar duvidas sobre privacidade, entre em contato:
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
