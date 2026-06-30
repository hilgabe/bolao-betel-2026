# Bolao Betel 2026

Plataforma mobile-first para o bolao do mata-mata da Copa do Mundo 2026 da Celula Betel.

## Stack

- React + Vite + TypeScript
- TailwindCSS
- Firebase Authentication com nome + senha
- Firebase Firestore
- React Router
- PWA com `vite-plugin-pwa`
- Deploy preparado para Vercel

## Rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env` e preencha as variaveis do Firebase.

```bash
cp .env.example .env
```

3. Rode o app:

```bash
npm run dev
```

## Firebase

No Firebase Authentication, habilite o provedor **Email/Password**.

O usuario entra com nome e senha. O app nao mostra e-mail, mas cria um e-mail interno para o Firebase Auth. Exemplo: `Hilson Gabriel` vira `hilson-gabriel@bolao-betel.local`.

A senha precisa ter pelo menos 6 caracteres porque essa e a exigencia do Firebase para autenticacao com senha. Use algo simples para o grupo lembrar, por exemplo `betel26`.

Colecao `users`:

- `uid`
- `nome`
- `email` interno gerado pelo app
- `role`: `user` ou `admin`
- `totalPontos`
- `authUid`: uid do Firebase Auth
- `createdAt`

Colecao `matches`:

- `id`
- `codigo`
- `fase`
- `date`
- `time`
- `teamA`
- `teamB`
- `flagA`
- `flagB`
- `status`
- `scoreA`
- `scoreB`
- `winner`
- `scorersTexto`
- `resultUpdatedAt`

Colecao `predictions`:

- dados do palpite do usuario
- placar previsto
- classificado previsto
- `jogadoresGolTexto`
- campos de pontuacao
- `totalPontos`
- `pontuado`
- `observacaoAdmin`

Para liberar `/admin`, entre no app com seu nome, depois va no Firestore em `users/{seu-id}` e altere:

```txt
role: "admin"
```

No painel `/admin`, use o botao `Sincronizar jogos` para gravar os jogos iniciais do arquivo `src/data/matches.ts` na colecao `matches`. Essa sincronizacao usa merge, entao nao apaga placares oficiais ja salvos.

Em `/admin/jogo/:matchId`, atualize o resultado oficial uma vez por jogo. A tabela dinamica em `/tabela` usa esses dados em tempo real. O botao `Aplicar pontuacao automatica` calcula todos os palpites daquele jogo de uma vez.

## Pontuacao

- Classificado correto: 1 ponto.
- Placar exato do jogo antes dos penaltis: 2 pontos.
- Placar exato dos penaltis: 1 ponto, somente quando o jogo terminar empatado.
- Gols dos jogadores: 1 ponto por gol previsto corretamente para cada jogador.
- Extras: campo manual do admin para ajustes excepcionais.

Exemplo: se Vini Jr fez 2 gols e o participante escreveu `Vini Jr 2`, recebe 2 pontos de gols. Se escreveu apenas `Vini Jr`, recebe 1 ponto. Se escreveu `Vini Jr 3`, recebe no maximo 2 pontos, porque o limite e o numero real de gols.

Se o placar terminar empatado, o participante e o admin precisam informar os penaltis. O classificado e calculado pelos penaltis, e esse acerto entra na regra de classificado correto.

Placar do jogo e placar dos penaltis pontuam de forma independente. Exemplo: se o jogo foi `1 x 1` e os penaltis foram `4 x 2`, quem colocou `1 x 1` mas errou os penaltis ganha os 2 pontos do placar. Quem errou o placar do jogo, mas colocou os penaltis `4 x 2`, ganha 1 ponto pelos penaltis.

## Regras do Firestore para comecar

Use estas regras durante a fase inicial de teste:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Isso exige que a pessoa esteja autenticada no Firebase. Depois, da para endurecer as regras antes de divulgar o bolao.

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure as mesmas variaveis `VITE_FIREBASE_*` em Project Settings > Environment Variables.
3. O build command pode ficar `npm run build`.
4. O output directory e `dist`.

`vercel.json` ja contem rewrite para SPA.

Depois do primeiro deploy, volte no Firebase em **Authentication > Settings > Authorized domains** e adicione o dominio da Vercel, por exemplo:

```txt
seu-projeto.vercel.app
```

## Regras de produto

- Nao ha campo de decepcao.
- Nao ha campo de destaque do jogo.
- Nomes de jogadores sao texto livre.
- Empate exige penaltis para definir o classificado.
- Palpites dos usuarios ficam visiveis na pagina do jogo depois que o prazo encerra.
- O admin lanca o resultado oficial uma vez por jogo.
- A tabela dinamica reflete os resultados oficiais salvos em `matches`.
- Ranking soma os pontos gravados nos palpites de cada usuario.
- Palpites so ficam abertos no dia do jogo, antes do horario da partida, usando `America/Sao_Paulo`.
