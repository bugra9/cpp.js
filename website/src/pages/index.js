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
{`import { Factorial } from './native/Factorial.h';

const factorial = new Factorial(99999);
const result = factorial.calculate();
console.log(result); // execution time: 0.863s`}
                    </CodeBlock>
                    <CodeBlock
                        language="cpp"
                        title="/src/native/Factorial.h"
                        showLineNumbers>
{`class Factorial {
private:
    int number;

public:
    Factorial(int num) : number(num) {}

    int calculate() {
        if (number < 0) return -1;

        int result = 1;
        for (int i = 2; i <= number; i += 1) {
            result *= i;
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
{`import { Factorial } from './Factorial.js';

const factorial = new Factorial(99999);
const result = factorial.calculate();
console.log(result); // execution time: 2.314s`}
                    </CodeBlock>
                    <CodeBlock
                        language="js"
                        title="/src/Factorial.js"
                        showLineNumbers>
{`export class Factorial {
  constructor(number) {
    this.number = number;
  }

  calculate() {
    if (this.number < 0) return -1;

    let result = 1;
    for (let i = 2; i <= this.number; i += 1) {
      result *= i;
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
