FROM emscripten/emsdk:3.1.51
RUN apt-get update
RUN apt-get install -y sqlite3

WORKDIR /emsdk/upstream/emscripten/src/embind
RUN wget https://raw.githubusercontent.com/bugra9/emscripten/embind-overloading-support/src/embind/embind.js -O embind.js

WORKDIR /emsdk/upstream/emscripten
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./system/include/emscripten/bind.h;
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./cache/sysroot/include/emscripten/bind.h;

WORKDIR /home/emscripten
RUN wget -qO- "https://github.com/Kitware/CMake/releases/download/v3.25.2/cmake-3.25.2-linux-x86_64.tar.gz" | tar --strip-components=1 -xz -C /usr/local

WORKDIR /home/emscripten
RUN wget https://github.com/bugra9/swig/archive/refs/heads/add-embind-support.zip
RUN unzip add-embind-support.zip

WORKDIR /home/emscripten/swig-add-embind-support
RUN apt-get install -y automake libpcre2-dev libbison-dev
RUN cmake .
RUN make
RUN make install

WORKDIR /home/emscripten
RUN rm -rf add-embind-support.zip swig-add-embind-support
