import { 
    Container,
    Flex, 
    Box, 
    Text,
    Spacer,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Spinner,
    Center,
    Checkbox,
    VStack,
    Textarea
} from '@chakra-ui/react'
import {
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { API_URL } from '../config';
import { useState, useEffect } from 'react';

//@ts-ignore
export default function Dashboard(props) {
    const { publicKey, signMessage } = useWallet();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedServers, setSelectedServers] = useState([]);
    const [disabledServers, setSisabledServers] = useState([]);
    const [msgValue, setMsgValue] = useState('');

    useEffect(() => {
        //@ts-ignore
        setSelectedServers(new Array(props.data.guilds.length).fill(false));

        const disabled: boolean[] = new Array(props.data.guilds.length).fill(false);
        props.data.guilds.forEach((elem:any, index:any) => {
            disabled[index] = elem['news_channel_id'] ? false : true;
        });

        //@ts-ignore
        setSisabledServers(disabled);
    }, []);


    const onSendHandler = async () => {
        onOpen();

        if (!signMessage || !publicKey) {
            console.error('>> First connect a wallet');
            onClose();
            return;
        }

        try {    
            let ids: any[] = [];

            selectedServers.forEach((elem: any, index: any) => {
                if (elem) {
                    ids.push(props.data.guilds[index].guild_id);
                    console.log(props.data.guilds[index]);
                }
            });

            if (ids.length == 0) {
                alert('No servers selected');
                return;
            }
            
            const data = {
                'content': msgValue,
                'guild_ids': ids.join(';')
            };

            const message = new TextEncoder().encode(JSON.stringify(data));
            const signature = await signMessage(message);
            const base64str = Buffer.from(signature).toString('base64');

            const payload = {
                'data': data,
                'signature': base64str,
                'wallet': publicKey.toString(),
            };

            const res = await (await fetch(`${API_URL}/discord_oak_news_create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })).json();

            if (Object.hasOwn(res, 'error')) {
                alert('Failed to log in');
            } else {
                alert('News sent!');
            }
        } catch (error) {
            alert('Operation failed');
        } finally {
            onClose();
        }
    };




    const handleInputChange = (e: any) => {
        let inputValue = e.target.value
        setMsgValue(inputValue)
    };

    const checkboxHandler = (e: any, id: any) => {
        const newArray:any[] = Array.from(selectedServers);
        newArray[id] = e.target.checked;

        //@ts-ignore
        setSelectedServers(newArray);
    };

    const selectAll = () => {
        const newArray:any[] = Array.from(selectedServers);
        newArray.forEach((elem, id) => {
            if (!disabledServers[id]) {
                newArray[id] = true;
            }
        });

        //@ts-ignore
        setSelectedServers(newArray);
    };

    const unselectAll = () => {
        const newArray:any[] = Array.from(selectedServers);
        newArray.forEach((elem, id) => newArray[id] = false);

        //@ts-ignore
        setSelectedServers(newArray);
    };

    const isSendBtn: boolean = msgValue != null && msgValue.length > 0;

    return (
        <>
         <Modal onClose={() => {}} isOpen={isOpen} isCentered size='xs'>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="center">Loading...</ModalHeader>

                <ModalBody textAlign="center">
                    <Spinner />
                </ModalBody>
            </ModalContent>
        </Modal>
        
        <Container maxW="800px" marginTop="100px" backgroundColor="white" borderRadius="10px" paddingTop="25px"  textAlign="center">
            <Flex paddingBottom='25px'>
                <VStack alignContent='flex-start' w='230px' bg='green.500' height='500px' backgroundColor='white' borderRadius='10px 0 0 10px' padding='10px' overflowY='scroll'>
                    <Text fontWeight='bold' fontSize='18px' paddingBottom='5px'>Select servers</Text>
                    
                    {props.data.guilds.map((item: any, id: any) => {
                        return (
                            <Checkbox  key={item.guild_id} isDisabled={disabledServers[id]} isChecked={selectedServers[id]}  onChange={(e) => checkboxHandler(e, id)} width='100%'>{item.guild_name}</Checkbox>
                        );
                    })}
                   
                </VStack>
                <Center flex='1' padding='10px'>
                    <Textarea placeholder='Text to send' height='100%' resize='none'  value={msgValue} onChange={handleInputChange}/>
                </Center>
            </Flex>

            <Flex paddingBottom='20px'>
                <Button colorScheme='gray' size='sm' onClick={selectAll}>
                    Select all
                </Button>
                <Button colorScheme='gray' size='sm' marginLeft='15px' onClick={unselectAll}>
                    Unselect all
                </Button>

                <Spacer/>

                <Button colorScheme='telegram' onClick={onSendHandler} isDisabled={!isSendBtn}>
                    Send
                </Button>
            </Flex>
          
        </Container>
       </>
    );
}