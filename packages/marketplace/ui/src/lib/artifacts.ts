import JSZip from "jszip";

export const readArtifact = (artifactsZip: File) => {
  return new Promise<{ addresses: any; deployConfig: any }>(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          if (!event.target || !event.target.result) {
            reject(new Error("File reader error"));
            return;
          }

          const zip = await JSZip.loadAsync(event.target.result);

          const addresses = await zip.files["addresses.json"].async("text");
          const deployConfig =
            await zip.files["deploy-config.json"].async("text");

          resolve({
            addresses: JSON.parse(addresses),
            deployConfig: JSON.parse(deployConfig),
          });
        } catch (error) {
          console.error("Error reading zip file:", error);
        }
      };

      reader.readAsArrayBuffer(artifactsZip);
    }
  );
};
