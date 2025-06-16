// your-pinata-utils.ts

export async function uploadToPinata(file: File): Promise<any> {
  const pinataApiKey = "8132908c7a9b01b713eb";
  const pinataSecretApiKey = "a54fea1b167a189a5c935cb4eeb112f3993bbc5b7fd6d99056fbe5a790d47a51";

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("上传到 Pinata 出错");
  }

  const data = await response.json();
  return data;
}
