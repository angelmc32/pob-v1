import React, { useCallback, useMemo, useState } from "react";
import router from "next/router";
import { fetchSigner } from "@wagmi/core";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import BackButton from "~~/components/common/buttons/BackButton";
import PrimaryButton from "~~/components/common/buttons/PrimaryButton";
import FilePreview from "~~/components/image-handling/FilePreview";
import { InputBase } from "~~/components/inputs/InputBase";
import ToggleInput from "~~/components/inputs/ToggleInput";
import { createPobInputsArray, getInitialPobFormState } from "~~/components/pob/pob-form-input";
import { PersonalPOBFactoryContract } from "~~/contracts";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

const CreatePOB = () => {
  const deployedPersonalPOBFactory = process.env.NEXT_PUBLIC_PERSONAL_POB_FACTORY_ADDRESS || "0x0";
  const contractName = "POEPProfileFactory";
  const fileFormKey = "pob_image";

  // const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<Record<string, any>>(() => getInitialPobFormState(createPobInputsArray));
  const [imgObj, setImgObj] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const pobContractAddress = BigNumber.from("0x0"); // adding this to remove lint errors, check later!

  const { address: userAddress } = useAccount();

  // const { data: currentPobAddress, isLoading: isLoadingCurrentPobAddress } = useScaffoldContractRead({
  //   contractName,
  //   functionName: "userAddressToPobAddress",
  //   args: [userAddress],
  // });

  const { data: userPobProfileAddress } = useScaffoldContractRead({
    contractName,
    functionName: "userAddressToProfile",
    args: [userAddress],
  });

  const { data: currentUserPobAddress } = useScaffoldContractRead({
    contractName: "PersonalPOBFactory",
    functionName: "userAddressToPobAddresses",
    args: [userAddress, pobContractAddress],
  });

  // TODO: Implement fetch POB contract address (call profileAddressToPobAddress with Profile address from zustand store)
  // TODO: Implement fetch POB contract expiration (call profileAddressToPobExpiration)

  // const { writeAsync: createPersonalPob } = useScaffoldContractWrite({
  //   contractName,
  //   functionName: "createNewPersonalPob",
  //   args: [form["name"], userAddress, profileAddress],
  // });

  const poepFormInputs = useMemo(
    () =>
      createPobInputsArray.map((input: any, inputIndex: number) => {
        if (input.showWithToggleName?.length > 1 && form[input.showWithToggleName[0]] !== input.showWithToggleName[1]) {
          return;
        }
        return (
          <div className="w-full mb-4 lg:mb-4 px-2" key={`${input.name}_${inputIndex}`}>
            <div className="mb-1 pl-4 w-full text-left">
              <label className="text-lg font-medium">{input.label}</label>
            </div>
            {input.type !== "toggle" ? (
              <InputBase
                name={input.name}
                type={input.type}
                value={form[input.name] || ""}
                onChange={(value: any) => {
                  setForm(form => ({ ...form, [input.name]: value }));
                }}
                placeholder={input.placeholder}
                error={input.isError || false}
                disabled={input.isDisabled || false}
              />
            ) : (
              <div className="w-full flex justify-center">
                <ToggleInput
                  name={input.name}
                  isDefaultValueA={true}
                  onChange={(value: any) => {
                    setForm(form => ({ ...form, [input.name]: value }));
                  }}
                  valueA={input.valueA}
                  valueB={input.valueB}
                />
              </div>
            )}
          </div>
        );
      }),
    [form],
  );

  const previewImage = useMemo(() => {
    if (imgObj) {
      return URL.createObjectURL(new Blob([imgObj]));
    }
    return null;
  }, [imgObj]);

  const handleCreatePersonalPob = useCallback(
    async (event: any) => {
      event.preventDefault();
      setIsLoading(true);
      if (!userPobProfileAddress || parseInt(userPobProfileAddress) == 0) return;
      const signer = await fetchSigner();
      const personalPobFactoryContract = new ethers.Contract(
        deployedPersonalPOBFactory,
        PersonalPOBFactoryContract.abi,
        signer as any,
      );
      try {
        const formData = new FormData();
        formData.append("files", new Blob([imgObj]));
        // formData.append("profileAddress", userPobProfileAddress);
        if (Object.keys(form).length > 0) {
          for (const key in form) {
            if (form[key]) {
              formData.append(key, form[key]);
            }
          }
        }
        const res = await axios.post("/api/upload-personal-pob", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const tx = await personalPobFactoryContract.createNewPersonalPob(
          form.name,
          userAddress,
          userPobProfileAddress,
          res.data.nftUrl,
          { value: ethers.utils.parseEther("1.0") },
        );

        console.log(tx);

        toast.success("Successfully created your POB!!!", {
          position: "top-center",
        });
        router.push("/dashboard");
      } catch (error: any) {
        if (error.body) {
          const parsedBody = JSON.parse(error.body);
          const { message } = parsedBody.error;
          toast.error(message, {
            position: "bottom-right",
          });
        } else {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [deployedPersonalPOBFactory, form, imgObj, userAddress, userPobProfileAddress],
  );

  return (
    <div className="flex flex-col py-8 px-4 lg:px-8 lg:py-12 justify-center items-center min-h-full">
      <h1 className="text-4xl font-semibold text-center mb-4">Create POB</h1>
      <BackButton />
      <div
        id="personal-pob-container"
        className="w-full md:w-11/12 my-4 rounded-lg flex flex-col items-center bg-base-100 border-base-300 border shadow-md shadow-secondary"
      >
        {currentUserPobAddress && parseInt(currentUserPobAddress) != 0 ? (
          <div className="w-full flex flex-col md:flex-row md:flex-wrap lg py-8 px-4 lg:px-8 lg:py-12 justify-center items-center md:items-start">
            <p className="text-center text-lg font-medium px-4">
              Currently only one active POB supported.
              <br /> We will update when more active POBs are supported.
            </p>

            <p className="text-4xl mt-4 w-full flex justify-center">🤓</p>
          </div>
        ) : (
          <div className="w-full flex flex-col md:flex-row md:flex-wrap lg py-8 px-4 lg:px-8 lg:py-12 justify-center items-center md:items-start">
            <p className="text-center text-lg font-medium w-full">Please fill the details:</p>
            <div className="text-center text-lg font-medium w-full md:w-2/3 lg:w-1/2 p-4">
              <div className="m-2 px-4 lg:px-4 xl:px-24 2xl:px-32">
                <FilePreview fileFormKey={fileFormKey} previewImage={previewImage} setImgObj={setImgObj} />
              </div>
            </div>
            {userPobProfileAddress && parseInt(userPobProfileAddress) ? (
              <form
                className="text-center text-lg font-medium w-full px-2 md:w-2/3 md:flex md:flex-col lg:w-1/2 lg:pt-4 lg:pr-12 xl:pr-20"
                onSubmit={handleCreatePersonalPob}
              >
                {poepFormInputs}
                <div className="w-full mt-12 md:mt-6 lg:mt-4">
                  <div className="flex justify-center">
                    <p className="font-medium border-orange-700 border-2 rounded-xl w-3/5 py-2">Cost: 1 MATIC</p>
                  </div>
                  <PrimaryButton
                    buttonText="Create POB"
                    classModifier="text-lg w-3/5"
                    isDisabled={!previewImage || isLoading}
                  />
                </div>
              </form>
            ) : (
              <div className="text-center text-lg font-medium w-full px-2 md:w-2/3 md:flex md:flex-col lg:w-1/2 lg:mt-12 xl:pr-20">
                <h4 className="text-xl">You need a POB Profile</h4>
                <PrimaryButton buttonText="I want my Profile" classModifier="text-lg py-2 px-8" path="/dashboard" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePOB;
