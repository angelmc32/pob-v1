import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PrimaryButton from "../common/buttons/PrimaryButton";
import POBImage from "../image-handling/POBImage";
import { AddressInput } from "../scaffold-eth";
import { fetchSigner } from "@wagmi/core";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { PersonalPOBContract } from "~~/contracts";
import { useDeployedContractRead } from "~~/hooks/scaffold-eth/useDeployedContractRead";
import { useDeployedContractWrite } from "~~/hooks/scaffold-eth/useDeployedContractWrite";

export type TPobCard = {
  globalTokenUri?: string; // URI of the base URI metadata
  maxSupply: number; // Maximum number of tokens available for minting
  mintExpirationDateJS: number; // Date limit for minting in JavaScript (multiplied by 1000 in parent component)
  name: string; // Name of the Pob Collection
  networkName: string;
  nftImageUri: string; // Pob Collection Image gateway uri
  pobAddress: string; // Pob Collection contract address
  pobCollectionId: number; // Pob Collection "tokenId"-like identifier inside PersonalPOBFactory contract
  symbol: string; // Symbol of the Pob Collection ("POB")
};

const PobCollectionCard = ({
  maxSupply,
  mintExpirationDateJS,
  name,
  nftImageUri,
  pobAddress,
  pobCollectionId,
  symbol,
}: TPobCard) => {
  const personalPobName = "PersonalPOB";
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mintToAddress, setMintToAddress] = useState<string>("");

  const {
    writeAsync: writeMintPersonalPob,
    isLoading: isLoadingMintPersonalPob,
    isMining: isMiningMintPersonalPob,
  } = useDeployedContractWrite({
    contractAddress: pobAddress,
    contractName: personalPobName,
    functionName: "safeMint",
    args: [mintToAddress],
  });

  const { data: personalPobTotalSupply, refetch: refetchPersonalPobTotalSupply }: any = useDeployedContractRead({
    contractAddress: pobAddress,
    contractName: personalPobName,
    functionName: "totalSupply",
    args: [],
    enabled: false,
  });

  useEffect(() => {
    console.log(personalPobTotalSupply);
    if (pobAddress && !personalPobTotalSupply) {
      refetchPersonalPobTotalSupply();
    }
  }, [personalPobTotalSupply, pobAddress, refetchPersonalPobTotalSupply]);

  const writeMintPob: any = useCallback(
    async (event: any) => {
      event.preventDefault();
      setIsLoading(true);

      const signer = await fetchSigner();
      const personalPobContract = new ethers.Contract(pobAddress, PersonalPOBContract.abi, signer as any);

      try {
        const tx = await personalPobContract.safeMint(mintToAddress);
        console.log(tx);
        toast.success("Successfully set your Profile", {
          position: "top-center",
        });
      } catch (error: any) {
        console.log(error);
        if (error.error) {
          toast.error(error.error.data.message || "Please try again later 🫣", {
            position: "top-center",
          });
        } else {
          toast.error("An error occurred, please try again later 🫣", {
            position: "top-center",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [mintToAddress, pobAddress],
  );

  return (
    <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-xl w-full px-4 py-4">
      <div className="w-full flex justify-center py-4 px-16">
        <POBImage imageURI={nftImageUri} />
      </div>
      <h4 className="mb-0 text-xl font-medium text-center px-1">{name}</h4>
      <h5 className="mb-0 text-md font-medium text-center px-1">
        {symbol} Collection #{pobCollectionId}:
      </h5>
      <div className="text-center text-lg font-medium w-full">
        <div className="w-full flex justify-center gap-8 my-4">
          <div className="w-1/3 lg:w-1/5">
            {mintExpirationDateJS && (
              <>
                <label
                  htmlFor={`mint-pob-modal-${pobAddress}`}
                  className={`btn btn-primary normal-case w-full ${
                    Date.now() >= mintExpirationDateJS || personalPobTotalSupply >= maxSupply ? "btn-disabled" : ""
                  }`}
                >
                  Mint
                </label>
                <input className="modal-toggle" id={`mint-pob-modal-${pobAddress}`} type="checkbox" />
                <div className="modal">
                  <div className="modal-box relative">
                    <label
                      htmlFor={`mint-pob-modal-${pobAddress}`}
                      className="btn btn-sm btn-circle absolute right-2 top-2"
                    >
                      ✕
                    </label>
                    <h2 className="mt-12 mb-8 text-2xl font-medium text-center">Mint NFT and transfer to:</h2>
                    <div className="mb-8 px-4">
                      <AddressInput
                        name="mintRecipientAddress"
                        onChange={(value: any) => setMintToAddress(value)}
                        placeholder="Enter address or ENS"
                        value={mintToAddress}
                      />
                    </div>
                    <div className="w-full flex justify-center mt-8 mb-8">
                      <PrimaryButton
                        buttonText="Mint"
                        classModifier="w-3/5 md:w-3/5 lg:w-2/5 text-xl"
                        isDisabled={isLoadingMintPersonalPob || isMiningMintPersonalPob}
                        isLoading={isLoadingMintPersonalPob || isMiningMintPersonalPob}
                        onClick={async () => {
                          console.log(mintToAddress);
                          console.log(pobAddress);
                          await writeMintPersonalPob();
                          setMintToAddress("");
                          refetchPersonalPobTotalSupply();
                        }}
                        showLoader={true}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="w-1/3 lg:w-1/5">
            <label htmlFor="share-profile-pob-modal" className="btn btn-disabled normal-case w-full">
              Share
            </label>
            <input disabled type="checkbox" id="share-profile-pob-modal" className="modal-toggle" />
            <div className="modal">
              <div className="modal-box relative">
                <label htmlFor="share-profile-pob-modal" className="btn btn-sm btn-circle absolute right-2 top-2">
                  ✕
                </label>
                <h2 className="mt-12 mb-8 text-2xl font-medium text-center">Share mint link:</h2>
                <div className="mb-8 px-4">
                  <AddressInput
                    name="mintRecipientAddress"
                    onChange={(value: any) => setMintToAddress(value)}
                    placeholder="Enter address or ENS"
                    value={mintToAddress}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {Date.now() >= mintExpirationDateJS && <p>POB minting deadline has passed</p>}
        {personalPobTotalSupply && personalPobTotalSupply >= maxSupply && (
          <p>POB minting max supply has been reached</p>
        )}
        <div className="mt-4">
          {personalPobTotalSupply && (
            <p className="mb-2">
              Total minted: {parseInt(personalPobTotalSupply._hex)} / {maxSupply}
            </p>
          )}
          <Link
            className="flex justify-center items-center hover:cursor-pointer hover:underline hover:underline-offset-2 w-full mb-2"
            href={`https://mumbai.polygonscan.com/address/${pobAddress}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenSea
            <ArrowTopRightOnSquareIcon className="w-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PobCollectionCard;
