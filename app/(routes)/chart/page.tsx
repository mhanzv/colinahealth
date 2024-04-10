"use client";
import { onNavigate } from "@/actions/navigation";
import { getAccessToken } from "@/app/api/login-api/accessToken";
import { fetchPatientPrescriptions } from "@/app/api/patients-api/patientTimeGraph";
import { PRNMedModal } from "@/components/modals/prn-medication.modal";
import PatientCard from "@/components/patientCard";
import TimeGraph from "@/components/timeGraph";
import { formUrlQuery } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChartPage() {
  const router = useRouter();
  if (!getAccessToken()) {
    onNavigate(router, "/login");
  }
  const [patientList, setPatientList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [gotoError, setGotoError] = useState(false);
  const [pageNumber, setPageNumber] = useState("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPrescriptions, setTotalPrescriptions] = useState<number>(1);
  const [patientUuid, setPatientUuid] = useState<string>("");
  const [PRNData, setPRNData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to handle going to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleGoToPage = (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    const pageNumberInt = parseInt(pageNumber, 10);

    // Check if pageNumber is a valid number and greater than 0
    if (
      !isNaN(pageNumberInt) &&
      pageNumberInt <= totalPages &&
      pageNumberInt > 0
    ) {
      setCurrentPage(pageNumberInt);

      console.log("Navigate to page:", pageNumberInt);
    } else {
      setGotoError(true);
      setTimeout(() => {
        setGotoError(false);
      }, 3000);
      console.error("Invalid page number:", pageNumber);
    }
  };

  const handlePageNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageNumber(e.target.value);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`flex border border-px items-center justify-center  w-[49px]  ${
            currentPage === i ? "btn-pagination" : ""
          }`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  const patientWithMedicationLogsToday = patientList?.filter((patient) => {
    // Assuming medicationlogs is an array and you want to check if any of the logs were created today
    return patient.medicationlogs.some((log: any) => {
      // Explicitly define the type of 'log' as 'any'
      // Check if the createdAt of any medication log is today's date
      const createdAtDate = new Date(log.createdAt);
      const today = new Date();
      return createdAtDate.toDateString() === today.toDateString();
    });
  });

  const isModalOpen = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else if (!isOpen) {
      document.body.style.overflow = "scroll";
      setPRNData([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientListWithPrescription = await fetchPatientPrescriptions(
          currentPage,
          router
        );
        setPatientList(patientListWithPrescription.data);
        setTotalPages(patientListWithPrescription.totalPages);
        setTotalPrescriptions(patientListWithPrescription.totalCount);
      } catch (error) {
        console.error("Error fetching patientListWithPrescription list:");
      }
    };

    fetchData();
  }, [currentPage, isOpen]);



  const [id, setId] = useState("");
  const searchParams = useSearchParams();
  useEffect(() => {
    if (id) {
      isModalOpen(true);
    }
  }, [id]);
  const handlePRNClicked = (patientId: string) => {
    setId(patientId); // Update state first
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: patientId,
    });
    router.push(newUrl, { scroll: true }); // Update URL immediately
  };

  const onSuccess = () => {
    setIsSuccessOpen(true);
    setIsEdit(false);
    isModalOpen(false);
  };
  const onFailed = () => {
    setIsErrorOpen(true);
    setIsEdit(false);
  };
  interface Modalprops {
    label: string;
    isOpen: boolean;
    isModalOpen: (isOpen: boolean) => void;
  }

  return (
    <div className="App w-full h-full pt-24 overflow-y-hidden px-28 ">
      <div className="w-full flex items-end -mt-8 py-5 bg-[#F4F4F4] ">
        <h1 className="text-start p-title ml-5 -mb-14 absolute flex items-end z-10">Patient Time Chart</h1>
      </div>
      <div className="w-full h-full flex flex-col ">
        <div className="flex flex-row bg-[#F4F4F4]">
          <div className="w-2/6 h-full sticky top-0 pt-4">

            <PatientCard
              patientWithMedicationLogsToday={patientWithMedicationLogsToday}
              setPatientUuid={setPatientUuid}
              isModalOpen={isModalOpen}
            />
          </div>
          {/* Ensuring TimeGraph's height adjusts based on PatientCard's height */}
          <div className="w-4/6 h-full  overflow-y-hidden ">
           <div className="w-full h-full"> <TimeGraph
              patientWithMedicationLogsToday={patientWithMedicationLogsToday}
            /></div>
          </div>
        </div>

        {/* pagination */}
        {totalPages <= 1 ? (
          <div></div>
        ) : (
          <div className="mt-5">
            <div className="flex justify-between">
              <p className="font-medium size-[18px] w-[138px] items-center">
                Page {currentPage} of {totalPages}
              </p>
              <div>
                <nav>
                  <div className="flex -space-x-px text-sm">
                    <div>
                      <button
                        onClick={goToPreviousPage}
                        className="flex border border-px items-center justify-center  w-[77px] h-full"
                      >
                        Prev
                      </button>
                    </div>
                    {renderPageNumbers()}

                    <div className="ml-5">
                      <button
                        onClick={goToNextPage}
                        className="flex border border-px items-center justify-center  w-[77px] h-full"
                      >
                        Next
                      </button>
                    </div>
                    <form onSubmit={handleGoToPage}>
                      <div className="flex px-5 ">
                        <input
                          className={`ipt-pagination appearance-none  text-center border ring-1 ${
                            gotoError ? "ring-red-500" : "ring-gray-300"
                          } border-gray-100`}
                          type="text"
                          placeholder="-"
                          pattern="\d*"
                          value={pageNumber}
                          onChange={handlePageNumberChange}
                          onKeyPress={(e) => {
                            // Allow only numeric characters (0-9), backspace, and arrow keys
                            if (
                              !/[0-9\b]/.test(e.key) &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight"
                            ) {
                              e.preventDefault();
                            }
                          }}
                        />
                        <div className="px-5">
                          <button type="submit" className="btn-pagination ">
                            Go{" "}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        )}
        {isOpen && (
          <PRNMedModal
            isModalOpen={isModalOpen}
            uuid={patientUuid}
            isOpen={isOpen}
            isEdit={isEdit}
            PRNData={PRNData}
            label="sample label"
            onSuccess={onSuccess}
            onFailed={onFailed}
            setErrorMessage={setError}
          />
        )}
      </div>
    </div>
  );
}