#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const AdmZip = require("adm-zip");
const puppeteer = require("puppeteer");
const simpleGit = require("simple-git");
const userEmail = process.env.USER_EMAIL;
const userPass = process.env.USER_PASSWORD;
const gitUsername = process.env.USER_NAME;
const gitPAT = process.env.USER_PAT;
const gHubEmail = process.env.GHUB_EMAIL;
const gHubUserName = process.env.GHUB_USERNAME;
const git = simpleGit();
const width = 1200;
const height = 900;

async function waitForSelectors(selectors, frame) {
  for (const selector of selectors) {
    try {
      return await waitForSelector(selector, frame);
    } catch (err) {
      console.error(err);
    }
  }
  throw new Error(
    "Could not find element for selectors: " + JSON.stringify(selectors)
  );
}

async function waitForSelector(selector, frame) {
  if (selector instanceof Array) {
    let element = null;
    for (const part of selector) {
      if (!element) {
        element = await frame.waitForSelector(part);
      } else {
        element = await element.$(part);
      }
      if (!element) {
        throw new Error("Could not find element: " + part);
      }
      element = (
        await element.evaluateHandle((el) =>
          el.shadowRoot ? el.shadowRoot : el
        )
      ).asElement();
    }
    if (!element) {
      throw new Error("Could not find element: " + selector.join("|"));
    }
    return element;
  }
  const element = await frame.waitForSelector(selector);
  if (!element) {
    throw new Error("Could not find element: " + selector);
  }
  return element;
}
//------------------------puppeteer start-----------------------------------//
const autoweb = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${width},${height}`],
    defaultViewport: {
      width,
      height,
    },
  });

  //creates 'download' dir for the zip to be saved in.
  const page = await browser.newPage();
  const downloadPath = path.resolve("../download");
  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  //connects to webflow and starts login process
  await page.goto("https://webflow.com/dashboard?org=Redtag-Digital");
  try {
    console.log("surfing to webflow");
    await page.waitForSelector(".abcRioButtonContentWrapper");
    await page.click(".abcRioButtonContentWrapper");
  } catch (error) {
    console.error(`This is the error: ${error}`);
  }

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Please enter the project name: ", async (project) => {
    rl.question("Please enter the commit message: ", async (commitMessage) => {
      console.log("Thank You! 😃");
      rl.close();
      try {
        await git.clone(
          `https://${gitUsername}:${gitPAT}@github.com/${gitUsername}/${project}`,
          `../download/clone`
        );
        git.cwd(`../download/clone`);
      } catch (err) {
        console.log(`nothing to clone because: ${err}`);
      }

      try {
        let pages = await browser.pages(); // get all open pages by the browser
        let popup = pages[pages.length - 1]; // the popup should be the last page opened

        //this can be hard coded to speed up the whole process sans login.
        await popup.keyboard.type(userEmail);
        await popup.keyboard.press("Enter");
        console.log("username entered");

        popup = pages[pages.length - 1]; // the popup should be the last page opened. this is done again for the password box.

        //this can be hard coded to speed up the whole process sans login.
        setTimeout(async () => {
          await popup.keyboard.type(userPass);
          await popup.keyboard.press("Enter");
        }, 4000);
        console.log("password entered");

        //waits for projects to load and opens user typed project.
        try {
          await page.waitForSelector(".hover-settings-container");

          page.click(`div[site-name=${project}]`);
        } catch (error) {
          console.error(error);
        }
        //clicks the export dropdown.
        await page.waitForSelector(".bem-TopBar_Body_ExportButton");
        //this setTime out length is because of the excessive time it takes to load the files in webflow. It will still sometimes fail to load ontime even with this.
        setTimeout(async () => {
          try {
            console.log("export dropdown detected");
            await page.click(".bem-TopBar_Body_ExportButton");
            console.log("export dropdown clicked");
          } catch (error) {
            console.error(error);
          }
        }, 10000);
        const targetPage = page;

        //waits for and prepares download
        const prepare = await waitForSelectors(
          [
            ["aria/Prepare ZIP", 'aria/[role="generic"]'],
            [
              "#designer-app-react-mount > div:nth-child(29) > div:nth-child(3) > div > div > div > div > div > div > div.kit-scrollbar > div:nth-child(9) > button:nth-child(4) > div",
            ],
          ],
          targetPage
        );
        await prepare.click({ offset: { x: 0.875, y: -1.9000244140625 } });
        console.log("preparing download");

        // clicks download.
        const element = await waitForSelectors(
          [
            ["aria/Download ZIP", 'aria/[role="generic"]'],
            [
              "#designer-app-react-mount > div:nth-child(29) > div:nth-child(3) > div > div > div > div > div > div > div.kit-scrollbar > div:nth-child(9) > a > button > div:nth-child(2)",
            ],
          ],
          targetPage
        );
        await element.click({
          offset: { x: 27.2249755859375, y: 5.0999755859375 },
        });
        console.log("downloading");
        //this setTimeout can be removed and replaced with something that reads file status----start file extraction/github flow..
        setTimeout(async () => {
          //
          let fileNames = fs.readdirSync("../download/");
          // chooses first file in the directory
          const fileData = fs.readFileSync(`../download/${fileNames[1]}`);
          //extracts download into the 'download/clone/${project}' dir.
          const zip = new AdmZip(fileData);
          await fs.emptyDir(`../download/clone/${project}`);
          zip.extractAllTo(
            /*target path*/ `../download/clone/${project}`,
            /*overwrite*/ true,
            console.log("Extracted")
          );

          fileNames = fs.readdirSync("../download/clone/");
          try {
            git.addConfig("user.email", `${gHubEmail}`);
            git.addConfig("user.name", `${gHubUserName}`);
          } catch (err) {
            // Printing error if any occurs
            console.error("error occured while " + "setting up git: " + err);
          }

          // Add all files for commit
          await git.add(`./${project}`).then(
            (addSuccess) => {
              console.log("files added");
              console.log(addSuccess);
            },
            (failedAdd) => {
              console.log(`adding files failed ${failedAdd}`);
            }
          );
          // Commit files
          await git.commit(commitMessage).then(
            (successCommit) => {
              console.log(`files committed! Message: ${commitMessage}`);
              console.log(successCommit);
            },
            (failed) => {
              console.log(`failed commmit ${failed}`);
            }
          );

          // Finally push to online repository.
          await git.push("origin", "master").then(
            (success) => {
              console.log(`repo successfully pushed: ${project}`);
            },
            (failed) => {
              console.log(`repo push failed: ${failed}`);
            }
          );

          // this is used to clear the dir after git push.
          await fs.emptyDir("../download");
          console.log("delete success! finished!");
          process.exit();
        }, 7000);
      } catch (error) {
        console.error(`This is the error: ${error}`);
      }
    });
  });
};
autoweb();
