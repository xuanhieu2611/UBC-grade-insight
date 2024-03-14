# UBC Grade Insight

This is a UBC CPSC 310 course project. This project is a full stack web that allows user upload `zip` files that contains valid data about UBC class including grades, year, sections, instructors, etc. and then can query information about UBC grade. For example, you may to get some insights about average grade of CPSC 213 courses from 2015 to 2022, or average grade of MATH courses taught by a specific instrutor.

Note: For testing purposes, the data about UBC classes is already added, users can just query from our data or add more if wanted.

For information about the project, autotest, and the checkpoints, see the course webpage.

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

2. `yarn test` to run the test suite. 

3. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files. This is also how you run your back end

4. Run `./frontend/index.html` to run the front end and you can play around from here.
