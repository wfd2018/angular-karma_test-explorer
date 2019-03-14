import { KarmaHelper } from "../karma/karma-helper";
import explorerKarmaConfig = require("../../config/test-explorer-karma.conf");
import { SpawnOptions } from "child_process";
import spawn = require("cross-spawn");
import { KarmaEventListener } from "../karma/karma-event-listener";
import * as path from "path";

export class AngularServer {
  private readonly karmaHelper: KarmaHelper;
  private readonly angularProjectRootPath: string;
  private angularProcess: any;

  public constructor(angularProjectRootPath: string, private baseKarmaConfigFilePath: string) {
    const userKarmaConfigFile = path.join(angularProjectRootPath, "src", "karma.conf.js");
    this.angularProjectRootPath = angularProjectRootPath;
    explorerKarmaConfig.setGlobals({
      karmaConfigFile: userKarmaConfigFile,
    });

    this.karmaHelper = new KarmaHelper();
  }

  public stopPreviousRun(): Promise<void> {
    if (this.angularProcess != null) {
      this.angularProcess.kill();
    }

    return new Promise<void>(resolve => {
      this.angularProcess.on("exit", (code: any, signal: any) => {
        global.console.log(`Angular exited with code ${code} and signal ${signal}`);
        const karmaEventListener = KarmaEventListener.getInstance();
        karmaEventListener.stopListeningToKarma();
        resolve();
      });
    });
  }

  public start(): boolean {
    if (!this.karmaHelper.isValidKarmaConfig(this.baseKarmaConfigFilePath)) {
      global.console.log("The karma.conf.js used is not valid");
      return false;
    }

    this.runNgTest();
    return true;
  }

  private runNgTest(): void {
    const cliArgs = ["test", `--karma-config="${require.resolve(this.baseKarmaConfigFilePath)}"`];
    global.console.log(`Starting Angular tests with arguments: ${cliArgs.join(" ")}`);

    const options = {
      cwd: this.angularProjectRootPath,
      shell: true,
    } as SpawnOptions;

    this.angularProcess = spawn("ng", cliArgs, options);

    // this.angularProcess.stdout.on('data', (data: any) => global.console.log(`stdout: ${data}`));
    this.angularProcess.stderr.on('data', (data: any) => global.console.log(`stderr: ${data}`));
    this.angularProcess.on("error", (err: any) => global.console.log(`error from ng child process: ${err}`));
  }
}
