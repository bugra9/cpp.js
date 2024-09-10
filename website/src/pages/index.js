import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import SeamlessIntegration from './seamless-integration.mdx';

function HomepageIntro() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <div className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container flex flex-wrap gap-20 min-h-[820px]">
        <div class="flex-1 justify-self-center self-center min-w-[23rem]">
            <h1 className="hero__title mb-3">{siteConfig.title}</h1>
            <p className="hero__subtitle mb-16 text-2xl">Bind C++ codes to JS on the web and react native without writing extra code.</p>
            <p className="hero__subtitle mb-2"><b>Why Cpp.js?</b></p>
            <p className="hero__subtitle mb-1 text-xl">- Seamless integration of C++ and JavaScript</p>
            <p className="hero__subtitle mb-1 text-xl">- Power of native performance</p>
            <p className="hero__subtitle mb-1 text-xl">- Use or create prebuilt cpp.js libraries</p>
            <p className="hero__subtitle mb-1 text-xl">- Cross Platform</p>

            <div className="mt-10 flex gap-5">
                <Link
                    className="bg-[#fb9700] hover:bg-[#ffa40c] text-white hover:text-white hover:no-underline font-bold py-2 px-4 rounded-full"
                    to="/docs/Getting%20Started/prerequisites">
                    Get Started
                </Link>
                <Link
                    className="simple-button border border-solid hover:no-underline font-bold py-2 px-4 rounded-full"
                    to="https://github.com/bugra9/cpp.js/tree/main/samples">
                    Samples
                </Link>
            </div>
        </div>
        <div class="flex-1">
            <Tabs>
                <TabItem value="cpp.js" label="C++ & JS using cpp.js">
                    <CodeBlock
                        language="js"
                        title="/src/index.js"
                        showLineNumbers>
{`import { initCppJs } './native/Matrix.h';

const { Matrix } = await initCppJs();
const a = new Matrix(1210000, 1);
const b = new Matrix(1210000, 2);
const result = a.multiple(b);
console.log(result); // execution time: 1.23s`}
                    </CodeBlock>
                    <CodeBlock
                        language="cpp"
                        title="/src/native/Matrix.h"
                        showLineNumbers>
{`class Matrix : public std::vector<int> {
public:
  Matrix(int size, int v) : std::vector<int>(size, v) {}
  int get(int i) { return this->at(i); }
  std::shared_ptr<Matrix> multiple(std::shared_ptr<Matrix> b) {
    int size = sqrt(this->size());
    auto result = std::make_shared<Matrix>(this->size(), 0);

    for (int i = 0; i < size; i += 1) {
      for (int j = 0; j < size; j += 1) {
        for (int k = 0; k < size; k += 1) {
          (*result)[i*size+j]+=this->at(i*size+k)*(*b)[k*size+j];
        }
      }
    }
    return result;
  }
};`}
                    </CodeBlock>
                </TabItem>
                <TabItem value="javascript" label="Only JS">
                    <CodeBlock
                        language="js"
                        title="/src/index.js"
                        showLineNumbers>
{`import { Matrix } from './Matrix.js';

const a = new Matrix(1210000, 1);
const b = new Matrix(1210000, 2);
const result = a.multiple(b);
console.log(result); // execution time: 3.503s`}
                    </CodeBlock>
                    <CodeBlock
                        language="js"
                        title="/src/Matrix.js"
                        showLineNumbers>
{`export class Matrix extends Array {
  constructor(size, v) { super(size); this.fill(v); }
  get(i) { return this[i]; }
  multiple(otherMatrix) {
    const size = Math.sqrt(this.length);
    const result = new Matrix(this.length, 0);

    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        for (let k = 0; k < size; k += 1) {
          result[i*size+j]+=this[i*size+k]*otherMatrix[k*size+j];
        }
      }
    }
    return result;
  }
}`}
                    </CodeBlock>
                </TabItem>
            </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout description="Bind c++ libraries to js on web and mobile.">
        <HomepageIntro />
        <div className={clsx('hero hero--primary mt-1', styles.heroBanner)}>
            <div className="container home-markdown text-lg max-w-3xl text-justify">
                <SeamlessIntegration />
            </div>
        </div>
    </Layout>
  );
}
