import ipaddress

class IOCValidator:
    def validate_ip(ip:str) -> bool:
        """
        Validate whether the given string is a valid IPv4 or IPv6 address.
        """

        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
        
