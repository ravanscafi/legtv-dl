# Legendas.tv Downloader

## English
Automagically download all missing subtitles for your tv shows from brazilian source [legendas.tv](http://legendas.tv) using Node.js.

---

## Português
Automagicamente baixe todas as legendas ausentes para suas séries de tv usando Node.js.

Não se esqueça de valorizar o ótimo trabalho do legenders deixando comentários no site e fazendo doações!

![legtv-dl](http://i.imgur.com/b9wPMYT.gif)

# Dependências

É necessário ter a ferramenta [**unrar**](http://www.rarlab.com/rar_add.htm).
`unrar` deve estar disponível no seu path.

Você pode instalar no Ubuntu utilizando o comando:
```
sudo apt-get install unrar
```

No OS X, você pode utilizar [Homebrew](http://brew.sh/) e instalar com o comando:
```
brew install unrar
```

No Windows, você provavalmente precisa baixar [daqui](http://www.rarlab.com/rar_add.htm), instalar/extrair ou sei lá, e colocar o caminho no seu path.

# Instalação

1. Clone esse repositório: `git clone https://github.com/rscafi/legtv-dl.git`.
1. Entre na pasta com `cd legtv-dl`.
1. Rode `npm install` (Você vai precisar do [Node.js e npm](https://nodejs.org/))).
1. Crie um arquivo `config.js` a partir do `config.sample.js` e o configure corretamente. (Você vai precisar de uma conta no [legendas.tv](http://legendas.tv)).
1. Rode com `node .`.
1. É isso! Que tal aproveitar o tempo economizado e elogiar os legenders?