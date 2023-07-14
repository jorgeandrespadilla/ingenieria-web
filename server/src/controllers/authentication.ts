import { InvalidTokenError, UnauthorizedError } from '@/common/errors';
import { db } from '@/database/client';
import {
    LoginRequestSchema,
    RefreshRequestSchema,
} from '@/schemas/authentication';
import {
    generateAccessToken,
    generateRefreshToken,
    readToken,
    verifyRefreshToken,
} from '@/utils/authToken';
import { catchErrors } from '@/utils/catchErrors';
import { validateAndParse } from '@/utils/validation';

export const authenticate = catchErrors(async (req, res) => {
    const data = validateAndParse(LoginRequestSchema, req.body);
    const tokenData = readToken(data.token);
    const userEmail = tokenData?.['email'];
    if (!userEmail) throw new InvalidTokenError('Token inválido.');
    const user = await db.user.findUnique({
        where: {
            email: userEmail,
        },
    });
    if (!user) throw new UnauthorizedError('El usuario no existe.');

    res.send({
        message: 'Inicio de sesión exitoso.',
        accessToken: generateAccessToken({ userId: user.id }),
        refreshToken: generateRefreshToken({ userId: user.id }),
    });
});

export const refresh = catchErrors(async (req, res) => {
    const { refreshToken } = validateAndParse(RefreshRequestSchema, req.body);

    const userId = verifyRefreshToken(refreshToken).userId;
    if (!userId)
        throw new InvalidTokenError('Token de actualización inválido.');

    const user = await db.user.findUnique({
        where: { id: userId },
    });

    if (!user) throw new InvalidTokenError('Usuario no encontrado.');

    res.send({
        message: 'Validación de sesión exitosa.',
        accessToken: generateAccessToken({ userId: user.id }),
        refreshToken: generateRefreshToken({ userId: user.id }),
    });
});
