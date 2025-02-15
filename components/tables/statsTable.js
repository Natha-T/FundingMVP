import styled from "styled-components"
import { 
    getLatestBlockHeight,
    getLogEvents, 
} from "../../pages/api/covalent"
import { useEffect, useState } from "react"
import Loading from "../Loading"
import SectionTitle from "../typography/SectionTitle"
import Address from "../functional/Address"
import Subtitle from "../typography/Subtitle"
import { useBlockNumber } from 'wagmi'

const StatsTable = ({pid, chain}) => {
    const [loading, setLoading] = useState(true)
    const [microCreatedLogs, setMicroCreatedLogs] = useState([]);
    const [transactionLogs, setTransactionLogs] = useState([]);
    const [filteredTransactionLogs, setFilteredTransactionLogs] = useState([]);
    const [filteredMicroCreatedLogs, setFilteredMicroCreatedLogs] = useState([]);

    const blockNumber = useBlockNumber({
        chainId: chain,
      })

    const Container = styled.div`
        padding-bottom: 2%;
        padding-top: 5%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-left: 10%;
        padding-right: 10%;
        @media (max-width: 768px) {
            flex-wrap: wrap;
            padding-left: 3%;
            padding-right: 3%;
  }
    `
    const Table = styled.table`
        width: 100%;
        border-collapse: collapse;
        border-radius: 10px;
        border: none;
        text-align: center;
        background: linear-gradient(132.28deg, rgba(47, 47, 47, 0.3) -21.57%, rgba(0, 0, 0, 0.261) 100%);
    `
    const Header = styled.th`
        border: none;
        padding: 1%;
        background-color: transparent;
        font-family: "Roboto";
    `
    const Row = styled.tr`
        padding: 1%;
        border-bottom: 1px solid grey;
        transition: 0.1s;
        &:hover{
            background: rgba(56, 56, 56, 0.4);
        }
    `
    const Cell = styled.td`
        padding: 2px;
        font-family: "Neucha";
    `

    const AddressCell = styled(Cell)`
        width: 150px;
        @media (max-width: 768px) {
        width: 50px;
  }
    `

    const Sub = styled.div`
        display: flex;
        margin: 3%;
    `

    //create function that maps data into a table using keys as headers
    const mapDataToTable = (data) => {
        return (
            <Table>
                <thead>
                    <Row>
                        {Object.keys(data[0]).map((key, index) => {
                            if(key != "fund_id"){
                                const formattedKey = key.split("_").map((word) => {
                                    return word.charAt(0).toUpperCase() + word.slice(1);
                                }
                                ).join(" ");
                                return <Header key={index}>{formattedKey}</Header>
                            }
                        })}
                    </Row>
                </thead>
                <tbody>
                    {data.map((row, index) => {
                        return (
                            <Row key={index}>
                                {Object.keys(row).map((key, index) => {
                                    if (key != "fund_id") {
                                        if (key === "donator_address" || key === "owner") {
                                            return <AddressCell key={index}>
                                                <Address address={row[key]} />
                                            </AddressCell>
                                        }
                                        if (key === "currency_id"){
                                            return <Cell key={index}>
                                                {row[key] == 1 && "USDC"}
                                                {row[key] == 2 && "USDT"}
                                                {row[key] == 3 && "DAI"}
                                                </Cell>
                                        }
                                        else{
                                            return <Cell key={index}>{row[key]}</Cell>
                                        }
                                    }
                                })}
                            </Row>
                        )
                    })}
                </tbody>
            </Table>
        )
    }

    useEffect(() => {
        const getData = async () => {
            //Grab latest block height to determine how many blocks to go back
            const latestBlockHeight = await getLatestBlockHeight(chain);

            // TBD I guess I broke the parsing by changing the event structure 
            // Covalent goes back 999 blocks, so we set the starting block back 999
            const startingBlock = blockNumber - 999;
            console.log('latest blockheight',blockNumber)
            console.log('get blockheight',latestBlockHeight)

            // Get all Log Events and then sort them into two event categories, MicroCreated and Transaction
            const logEvents = await getLogEvents(startingBlock, chain, blockNumber);
            const microCreatedEvents = logEvents.micro_created_log_data;
            const transactionEvents = logEvents.total_txn_log_data;
            setMicroCreatedLogs(microCreatedEvents);
            setTransactionLogs(transactionEvents);

            // filter data to render by the finding the logs that match the fund id to the incoming pid
            const filteredMicroCreatedLogs = microCreatedEvents.filter((log) => {
                return log.fund_id === pid;
            }
            )
            const filteredTransactionLogs = transactionEvents.filter((log) => {
                return log.fund_id === pid;
            }
            )
            // setFilteredMicroCreatedLogs(filteredMicroCreatedLogs);
            setFilteredTransactionLogs(filteredTransactionLogs);
            setFilteredMicroCreatedLogs(filteredMicroCreatedLogs);

            setLoading(false);
        }
        getData();
    }, [])

    return (<>
        <SectionTitle title='Project transactions' subtitle='Transparent on-chain records'/>
        <Container>
            <Sub><Subtitle text='Donations'/></Sub>
            {loading && <Loading />}
            {!loading && filteredTransactionLogs.length > 0 && mapDataToTable(filteredTransactionLogs)}
            {!loading && filteredTransactionLogs.length === 0 && <p>No transactions have been made in last 999 blocks</p>}
            <Sub><Subtitle text='Microfunds'/></Sub>
            {!loading && filteredMicroCreatedLogs.length > 0 && mapDataToTable(filteredMicroCreatedLogs)}
            {!loading && filteredMicroCreatedLogs.length === 0 && <p>No microfunds created in last 999 blocks</p>}
        </Container></>
    )
}

export default StatsTable;