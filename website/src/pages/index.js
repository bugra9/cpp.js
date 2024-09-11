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
      <div className="container flex flex-wrap gap-20 min-h-[calc(100vh-92px)]">
        <div class="flex-1 justify-self-center self-center min-w-[23rem]">
            <h1 className="hero__title mb-3">{siteConfig.title}</h1>
            <p className="hero__subtitle mb-16 text-2xl">Bind C++ code to JS on the web and React Native without writing any extra code.</p>

            <Tabs>
                <TabItem value="cppjs-create-npm" label="npm">
                    <CodeBlock language="shell">
                        npm create cpp.js@latest
                    </CodeBlock>
                </TabItem>
                <TabItem value="cppjs-create-pnpm" label="pnpm">
                    <CodeBlock language="shell">
                        pnpm create cpp.js@latest
                    </CodeBlock>
                </TabItem>
                <TabItem value="cppjs-create-yarn" label="yarn">
                    <CodeBlock language="shell">
                        yarn create cpp.js@latest
                    </CodeBlock>
                </TabItem>
                <TabItem value="cppjs-create-bun" label="bun">
                    <CodeBlock language="shell">
                        bun create cpp.js@latest
                    </CodeBlock>
                </TabItem>
            </Tabs>

            <div className="mt-10 flex gap-5 justify-center">
                <Link
                    className="start-button text-white hover:text-white hover:no-underline font-bold py-3 px-8 rounded"
                    to="/docs/Getting%20Started/prerequisites">
                    Get Started
                </Link>
            </div>
        </div>
        <div class="flex-1 max-w-full min-w-[40rem]">
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
console.log(result); // execution time: 0.872s`}
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
console.log(result); // execution time: 5.886s`}
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
                <TabItem value="codepen" label="Try it in your browser">
                <iframe height="600" style={{width: '100%'}} scrolling="no" title="Cpp.js WebAssembly Performance Test - Matrix Multiplier" src="https://codepen.io/bugra9/embed/qBzvvbZ?default-tab=result&editable=true" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/bugra9/pen/qBzvvbZ">
  Cpp.js WebAssembly Performance Test - Matrix Multiplier</a> by Bugra (<a href="https://codepen.io/bugra9">@bugra9</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>
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
    </Layout>
  );
}
