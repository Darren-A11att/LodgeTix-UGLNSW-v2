Subdomains in Next.js 14 — How to Structure a Scalable Multitenant Frontend Application
Excel Nwachukwu
Excel Nwachukwu

Follow
10 min read
·
Aug 24, 2024
253


5






Photo by Tierra Mallorca on Unsplash
Sunny Monday, the 22nd July, 2024 and I am writing this article in hope that I would find a solution to an issue I have with setting up the frontend of a multitenant application with subdomain routing and requests in Next.js where each ‘tenant’ is a subdomain, often common practice in Software as a Service (SaaS) applications.

Usually, when working on interfaces for any known application, you are tasked with building a centralized frontend for that application and focusing more energy on connecting the different interfaces to necessary APIs needed.

However, everything changes a little bit when you are tasked with granting each tenant opportunity to access the same software but from different domains while rendering unique pages and handling individual request for each where necessary?.

But hold on a sec…

What is a Multitenant Software?
Before we go any further…let’s understand what a multitenant system is.


A multi-tenant application is a type of software where a single instance of the application serves multiple clients (tenants or organizations in this case). Each client has their own data space and configuration, while each’s data is segregated for maintaining privacy and security.

Now, while Next.js offers all the unique tools out of the box for managing requests and building interactive pages, we still have to identify which host (subdomain) that request is coming in from. This is usually done through a middleware.

Next.js middleware runs on Vercel’s Edge Functions, which are serverless functions that run close to the user. You can read more on that in my previous post on creating secure routes with it.

How to Configure Secure Routes Using Next.js Middleware— the best way!
By leveraging middleware in Next.js, you can intercept requests and apply access control measures to your application’s…
trillionclues.medium.com

In an ideal scenario where tenants are under subdomains, each client accesses the application through a specific subdomain. For example, we could have something like this:

Client 1: client1.trillionclues.com
Client 2: client2.trillionclues.com
Client 3: client3.trillionclues.com
So, in essence, this approach allows customization at the subdomain level, facilitates data management and isolation for each client under their respective subdomain.

Now, few things to have in mind about this setup is that:

To create multi-tenant applications where each ‘tenant’ is a subdomain, you need a domain with a single extension (for example, .com, .ng, .tech). Going with the regular Vercel host like ‘trillionclues.vercel.app’ won’t work because the subdomain you would be trying to create will be ‘client1.myapp.vercel.app’.
Next, you need to figure out how to map each request to the subdomain/tenant making that request although this is dependent on how the backend expects the request. We want to assume it is one of two scenario where all the tenants would access same request URL (https://base-url.com) or have the subdomain of each tenant attached to it (https://client1-base-url.com).
Continued on 5th August, 2024


Before we get down to this, a few edge cases to be mindful of when structuring the frontend and backend of a multitenant application.

Consider this case scenario where there are different roles in each tenant; SYSTEM ADMIN, SUPER ADMIN and NORMAL USER in the system, with all three users sharing login page.

Unified Login Interface/Subdomain Access: Provide a single login page for all roles, allowing them to log in using the same interface regardless of their role. But, validate every log in attempt through an incorrect or invalid subdomain, restrict access.
Root Domain Access: Decide if the roles even though they are valid users on the system should have access to the root domain (e.g., yourdomain.com) directly.
Cross-Domain Access: Prevent roles with tenant-specific access (e.g., NORMAL USER) from accessing other tenants’ subdomains or the root domain or resources associated with their subdomain.
1. Setting Up Shop!
That’s out of the way, to get down to this, you would need to have a Next.js project created. This time, I’m using Next.js 14.2.5 and configured to use TypeScript and Tailwind CSS for starters.

npx create-next-app@latest
You will then be asked the following prompts:

What is your project named?  my-app
Would you like to use TypeScript?  No / Yes
Would you like to use ESLint?  No / Yes
Would you like to use Tailwind CSS?  No / Yes
Would you like your code inside a `src/` directory?  No / Yes
Would you like to use App Router? (recommended)  No / Yes
Would you like to customize the import alias (`@/*` by default)?  No / Yes
Now, that we have our Next.js app created, next is to add some files that would be integral to what we hope to accomplish.

2. Create API Route for Adding New Subdomain
In any Next.js environment, server-side code (like writing to a file) should be handled through an API route or server actions. You can read more about Next.js API routes below.

Routing: API Routes | Next.js
Next.js supports API Routes, which allow you to build your API without leaving your Next.js app. Learn how it works…
nextjs.org

Ideally, you want to make a request to retrieve a list of tenants in the system. Since we don’t have that luxury, we will create a simple JSON, use the Next.js API route to write to that file and add our new domains in it.

First, create a “subdomains.json” file at the root of your project — this file will hold our array of created subdomains.

[
  {
    "subdomain": "client1"
  }
]
Secondly, inside the app folder, create a file at app/api/add-subdomain/route.ts — add the following code inside the route.ts file.

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Subdomain {
  subdomain: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const { subdomain }: Subdomain = await request.json();

  if (!subdomain) {
    return NextResponse.json(
      { error: 'Subdomain is required' },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), 'subdomains.json');
  const fileData = fs.readFileSync(filePath, 'utf8');
  const subdomains: Subdomain[] = JSON.parse(fileData);

  subdomains.push({ subdomain });

  fs.writeFileSync(filePath, JSON.stringify(subdomains, null, 2));

  return NextResponse.json(
    { message: 'Subdomain added successfully' },
    { status: 200 }
  );
}
Here, the API route reads the subdomains.json file, appends the new subdomain to the array, and writes the updated array back to the file.

But we need a form to submit the new subdomain!

3. Adding New Subdomain
To create a form that allows us to send requests and add a new subdomain to the file, you’ll need to:

Set up state management for the subdomain input field.
Implement a handleSubmit function and call our API route to handle the form submission.
Inside the `app/page.tsx` file, add this line of code to the file and save.

"use client";
import { useState, FormEvent } from "react";

export default function Home() {
  const [subdomain, setSubdomain] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await fetch("/api/add-subdomain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subdomain }),
    });

    if (response.ok) {
      alert("Subdomain added successfully!");
    } else {
      alert("Failed to add subdomain");
    }

    setSubdomain("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Add Subdomain</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="subdomain">Subdomain:</label>
        <input
          type="text"
          id="subdomain"
          className="text-black p-1 mx-5"
          value={subdomain}
          onChange={(event) => setSubdomain(event.target.value)}
        />
        <button type="submit" className="text-black bg-white p-1">
          Add Subdomain
        </button>
      </form>
    </main>
  );
}
Having done this, when you go back, enter a new subdomain and click the add button, a new object will be added to the array of subdomains.

Once this is done, next is to handle the setup for routing and displaying the details of a specific tenant when they visit their individual routes.

Final shot on 23rd August, 2024

4. Subdomain Folder Routing
Alas, we are moving fast!

We now have some subdomain data ready. Now, let’s handle the folder routing structure for our multi-tenant application in Next.js.

To do this, we leverage on Next.js folder-based routing by creating a middleware.ts file at the root of our project:

middleware.ts:

import { NextResponse } from "next/server";
import subdomains from "./subdomains.json";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get("host") || "";

  // Define list of allowed domains
  // (including localhost and your deployed domain)
  const allowedDomains = ["localhost:3000", "trillionclues.com.com", "yourdomain.com"];

  // Check if the current hostname is in the list of allowed domains
  const isAllowedDomain = allowedDomains.some(domain => hostname.includes(domain));

  // Extract the potential subdomain from the URL
  const subdomain = hostname.split(".")[0];

  // If user is on an allowed domain and it's not a subdomain, allow the request
  if (isAllowedDomain && !subdomains.some(d => d.subdomain === subdomain)) {
    return NextResponse.next();
  }

  const subdomainData = subdomains.find(d => d.subdomain === subdomain);

  if (subdomainData) {
    // Rewrite the URL to a dynamic path based on the subdomain
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  return new Response(null, { status: 404 });
}
So, few things going on here:

— First, the config.matcher property defines the specific routes where the middleware will be applied. You can add the different user-facing routes of your application here.

— Next, the middleware intercepts the incoming request and extracts the URL and hostname from it. The hostname is crucial as it helps determine if the request is for a subdomain or the main domain.

— Then, extract the potential subdomain (e.g., client1 in client1.yourdomain.com). This is then checked against the list of allowed subdomains and the request’s hostname. If there is a match, the middleware proceeds to the next steps.

— Finally, validate the extracted subdomain against the list in subdomains.json. If this is truthy, the middleware rewrites the URL to point to the correct dynamic path that corresponds to the subdomain and also allows them to access different URL paths while staying on same subdomain.

PS: We will create that dynamic path next as this will allow the application to serve content specific to each subdomain without requiring creation of additional routes.

Another thing to note is, if the subdomain isn’t found in the subdomains.json file or is not allowed, the middleware responds with a 404 status. You can rewrite to an “access-denied” page here if necessary.

5. Subdomain Folder Routing
However, you can’t do all this without creating the actual subdomain route for the user to access. Here, you need a shared login page which all the tenants can access regardless.

Also, you can get creative by making a request to an endpoint here to fetch different tenants details like; logo, name which will be displayed when they visit their respective login page eg: client1.trillionclues.com/login, client2.trillionclues.com/login. While the default login can have the default details of the login page www.trillionclues.com/login.

Create the [subdomain] Folder
Inside the app directory, create a folder named [subdomain]. This is a structure in Next.js that allows us handle dynamic routes to indicate dynamic segments.

app/[subdomain]

app/
  └── [subdomain]/
Add a page.tsx File Inside the [subdomain] Folder
Create a page.tsx file within the [subdomain] folder. This file will handle the dynamic rendering of pages based on the subdomain accessed by the user.

app/[subdomain]/page.tsx

app/
  └── [subdomain]/
      └── page.tsx
Implement Dynamic Content in page.tsx
The page.tsx file should handle rendering content dynamically based on the subdomain including tenant-specific details like logo and names, or custom styles to display on the login page.
"use client";
import { useParams } from "next/navigation";

export default function LoginPage() {
  const params = useParams();
  const tenant = params.subdomain;

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-center mb-4 text-black">
          {tenant ? `Welcome to ${tenant}` : "Welcome"}
        </h1>
        <form className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
So now, you have a login page that dynamically displays tenant details based on the subdomain and allows them log into their account while remaining on same subdomain route.

6. Deploy to Vercel
Finally, all that is left is deployment.

1. Create a new Github repo and push your local changes. Then, deploy it to Vercel and ensure you add any environment variables that you configured to Vercel during the import process.

2. Next, get a custom domain that isn't trillionclues.vercel.app(we spoke about this earlier) and in your Vercel project, you would have to do some DNS configurations to add your root domain & wildcard domain as you have defined in your middleware.ts file earlier.


When adding your custom domain, ignore the recommended step to “add the www. version of your domain and redirect your root domain to it" – just add the root domain.
To set up wildcard domains, you’ll need to add the domain using the Nameservers method (as opposed to the recommended A records method).
That’s it — you can go to app trillionclues.com, access the log in page through the domain as well as the configured subdomains. If you want to read more about how to configure Namesavers, Vercel has a nice article below to checkout.

Adding & Configuring a Custom Domain
Learn how to add a custom domain to your Vercel project, verify it, and correctly set the DNS or Nameserver values.
vercel.com

Conclusion
Finally, that’s a wrap. I think the article started off focusing on frontend side of things, and ended up skewing to the backend specifics and requirement too. But, from here, I believe we have a solid foundation to structure the frontend of a tenant-based application and provide many clients with domain-inclusive applications void of route duplication.

I hope this has been helpful, and I’m available for any questions in the comments!

Until next time…WAGMI ❤️

Twitter/X: @trillionclues
Github: trillionclues
Portfolio: trillionclues.vercel.app

Nextjs
Multitenancy
SaaS
Tech
253


5




Excel Nwachukwu
Written by Excel Nwachukwu
53 followers
·
23 following
Software Engineer | Flutter & Next.js | Technical Writer | Work with me trillionclues@gmail.com | Connect with me http://twitter.com/trillionclues/


Follow
Responses (5)
Darren Allatt
Darren Allatt
﻿

Cancel
Respond
Alex
Alex

Oct 24, 2024


The middleware is the easiest approach and it works well, I don’t see the biggest issue in using a synchronous write of the subdomains json, unless you expect a high amount of new subdomains in a short amount of time. In this case I would opt for a…more
11


1 reply

Reply

Suraj Bahadur
Suraj Bahadur

Sep 9, 2024 (edited)


It would have been good if I found your blog earlier, I would not have struggled. I have build a multi tenant app using next js. You can visit the app and check (subsifynow) https://subsifynow.com
10


1 reply

Reply

Joodi
Joodi

Nov 10, 2024


This post was really helpful! I learned something new. Thank you for taking the time to share it.
7


1 reply

Reply

See all responses
More from Excel Nwachukwu
Named and Positional Arguments in JavaScript: Why not both?
Excel Nwachukwu
Excel Nwachukwu

Named and Positional Arguments in JavaScript: Why not both?
Parameters are variables in a function definition, while arguments are the actual values that is passed to the function when called.
Sep 28, 2024


How to Configure Secure Routes Using Next.js Middleware — the right way!
Excel Nwachukwu
Excel Nwachukwu

How to Configure Secure Routes Using Next.js Middleware — the right way!
By leveraging middleware in Next.js, you can intercept requests and apply access control measures to your application’s routes.
Jun 10, 2024
137
3


Managing Multiple Frontend Deployment Environments on Vercel and Netlify
Excel Nwachukwu
Excel Nwachukwu

Managing Multiple Frontend Deployment Environments on Vercel and Netlify
Deploying a frontend app is one thing, but automatic deployments for different pipelines — develop, staging, and prod is another…
Nov 1, 2024


How to Make Frontend Applications Highly Available — Beyond Just Code
Excel Nwachukwu
Excel Nwachukwu

How to Make Frontend Applications Highly Available — Beyond Just Code
The frontend is the first thing users see. If it’s broken, slow, or blank — nothing else matters.
Jun 1
6


See all from Excel Nwachukwu
Recommended from Medium
Complete Guide to Next.js App Router Internationalization with next-intl
Dev Genius
In

Dev Genius

by

Abdullah Al Hommada

Complete Guide to Next.js App Router Internationalization with next-intl
Internationalization (i18n) is essential for applications serving a global audience. In this comprehensive guide, we’ll explore how to…

Feb 26
1


How to Scale NestJS Performance: From 1000 to 100,000 Requests per Second 🚀
𝕄𝕒𝕙𝕞𝕠𝕦𝕕 𝕊𝕒𝕖𝕖𝕕
𝕄𝕒𝕙𝕞𝕠𝕦𝕕 𝕊𝕒𝕖𝕖𝕕

How to Scale NestJS Performance: From 1000 to 100,000 Requests per Second 🚀
NestJS can boost your application’s performance from 1,000 requests per second to 100,000 requests when optimized properly. NestJS…

5d ago
94


A Year with Next.js Server Actions: Lessons Learned
Yopeso
In

Yopeso

by

Alvis Ng

A Year with Next.js Server Actions: Lessons Learned
A Deep Dive into the Practicalities, Pitfalls, and Potential of Next.js’s Server-Side Feature

Jan 6
630
17


Image Preloading in Next.js 15: Make your website load ultra-fast
Thomas Augot
Thomas Augot

Image Preloading in Next.js 15: Make your website load ultra-fast
When building modern web applications, image loading performance can make or break the user experience. Slow-loading images create…
May 15


The Definitive Next.js Web Development Roadmap: From Foundations to FAANG-Ready Architectures
30 Days Coding
30 Days Coding

The Definitive Next.js Web Development Roadmap: From Foundations to FAANG-Ready Architectures
Next.js has become the de facto framework for building high-performance, SEO-friendly, and scalable React applications. At leading tech…
4d ago
2


Feature Sliced Design  in Next JS
Sriramanvellingiri
Sriramanvellingiri

Feature Sliced Design in Next JS
What is FSD and why is it needed ?