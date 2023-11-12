Out of the box, embind provides converters for many standard C++ types:

| C++ type | JS Type |
| -------- | ------- | 
| void | undefined |
| bool | true or false |
| char | Number |
| signed char | Number |
| unsigned char | Number |
| short | Number |
| unsigned short | Number |
| int | Number |
| unsigned int | Number |
| float | Number |
| double | Number |
| long | BigInt |
| unsigned long | BigInt |
| std::string | String |
| emscripten::val | anything |
| std::vector<T\> | TVector |
| std::map<T1, T2\> | Map |
