import { omit } from "lodash";
import { db } from "@/database/client";
import { catchErrors } from "@/utils/catchErrors";
import { EntityNotFoundError, ValidationError } from "@/common/errors";
import { UserCreateRequestSchema, UserUpdateRequestSchema } from "@/schemas/users";
import { validateAndParse } from "@/utils/validation";
import { UserWithRole } from "@/types";


export const getUsers = catchErrors(async (_req, res) => {
    const users = await db.user.findMany({
        include: { role: true },
    });

    const data = users.map((user) => mapToUserResponse(user));
    res.send(data);
});

export const getUserById = catchErrors(async (req, res) => {
    const userId = Number(req.params.userId);

    await validateUser(userId);

    const user = await db.user.findUnique({
        where: { id: userId },
        include: { role: true },
    });
    res.send(mapToUserResponse(user!));
});

export const createUser = catchErrors(async (req, res) => {
    const { roleId, ...data } = validateAndParse(UserCreateRequestSchema, req.body);
    await validateExistingEmail(data.email);

    const user = await db.user.create({
        data: {
            ...data,
            role: {
                connect: { id: roleId }
            },
        },
        include: { role: true },
    });
    res.send(mapToUserResponse(user));
});

export const updateUser = catchErrors(async (req, res) => {
    const userId = Number(req.params.userId);
    const { roleId, ...data } = validateAndParse(UserUpdateRequestSchema, req.body);
    await validateUser(userId);
    await validateExistingEmail(data.email, userId);

    const user = await db.user.update({
        where: { id: userId },
        data: {
            ...data,
            role: {
                connect: { id: roleId },
            }
        },
        include: { role: true },
    });
    res.send(mapToUserResponse(user));
});

export const deleteUser = catchErrors(async (req, res) => {
    const userId = Number(req.params.userId);

    if (userId === req.currentUser.id) {
        throw new ValidationError("La cuenta actual no puede ser eliminada.");
    }
    await validateUser(userId);

    // Check if user has any associated tickets
    const tickets = await db.ticket.findMany({
        where: { 
            OR: [
                { assigneeId: userId },
                { supervisorId: userId },
            ]
         },
    });
    if (!tickets.isEmpty()) {
        throw new ValidationError("El usuario tiene tickets asociados.");
    }

    await db.user.delete({
        where: { id: userId },
    });

    res.send({ message: "Usuario eliminado." });
});

export const getCurrentUser = catchErrors(async (req, res) => {
    res.send(mapToUserResponse(req.currentUser));
});

function mapToUserResponse(user: UserWithRole) {
    return {
        ...omit(user, ["password"]),
        fullName: `${user.firstName} ${user.lastName}`,
    };
}


//#region Validation functions

async function validateUser(userId: number) {
    const user = await db.user.findUnique({
        where: { id: userId },
    });

    if (!user) throw new EntityNotFoundError("Usuario", { id: userId });
}

async function validateExistingEmail(email: string, userId?: number) {
    // Check if email is already in use
    const user = await db.user.findUnique({
        where: { email },
    });

    if (!user) return;
    if (userId && user.id === userId) return;

    throw new ValidationError("El correo electrónico ya está en uso.", { email });
}

//#endregion