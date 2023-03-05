FROM emscripten/emsdk:3.1.17
RUN apt-get update

WORKDIR /emsdk/upstream/emscripten/src/embind
RUN wget https://raw.githubusercontent.com/bugra9/emscripten/embind-overloading-support/src/embind/embind.js -O embind.js

WORKDIR /home/emscripten
RUN wget https://github.com/bugra9/mobile-swig/archive/refs/heads/emscripten-support.zip
RUN unzip emscripten-support.zip

WORKDIR /home/emscripten/mobile-swig-emscripten-support
RUN apt-get install -y automake libpcre3 libpcre3-dev
RUN ./autogen.sh
RUN ./configure
RUN make
RUN make install

WORKDIR /home/emscripten
RUN wget -qO- "https://github.com/Kitware/CMake/releases/download/v3.25.2/cmake-3.25.2-linux-x86_64.tar.gz" | tar --strip-components=1 -xz -C /usr/local

WORKDIR /home/emscripten
RUN rm -rf emscripten-support.zip mobile-swig-emscripten-support
